#!/usr/bin/python
#
# NOTE: This is a compilation of multiple Python files.
#       See below for details on individual segments.
#
import base64, imp, os, sys, StringIO, zlib

__FILES = {}
__os_path_exists = os.path.exists
__builtin_open = open

def __comb_open(filename, *args, **kwargs):
  if filename in __FILES:
    return StringIO.StringIO(__FILES[filename])
  else:
    return __builtin_open(filename, *args, **kwargs)

def __comb_exists(filename, *args, **kwargs):
  if filename in __FILES:
    return True
  else:
    return __os_path_exists(filename, *args, **kwargs)

open = __comb_open
os.path.exists = __comb_exists
sys.path[0:0] = ['.SELF/']


###############################################################################
__FILES[".SELF/../HttpdLite/HttpdLite.py"] = """\
#!/usr/bin/python
#
# httpd_lite.py, Copyright 2012, Bjarni R. Einarsson <http://bre.klaki.net/>
#
# A very light-weight boilerplate HTTP daemon.
#
################################################################################
#
# This program is free software: you can redistribute it and/or modify it under
# the terms of the  GNU  Affero General Public License as published by the Free
# Software Foundation, either version 3 of the License, or (at your option) any
# later version.
#
# This program is distributed in the hope that it will be useful,  but  WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see: <http://www.gnu.org/licenses/>
#
################################################################################
#
import cgi
import socket
import tempfile
import threading
import time
import traceback
from urlparse import urlparse, parse_qs

import Cookie
import SocketServer
from SimpleXMLRPCServer import SimpleXMLRPCServer, SimpleXMLRPCRequestHandler


class RequestHandler(SimpleXMLRPCRequestHandler):

  rpc_paths = ( )

  def setup(self):
    self.chunked = self.suppress_body = False
    SimpleXMLRPCRequestHandler.setup(self)

  def send_header(self, header, value):
    self.wfile.write('%s: %s\\r\\n' % (header, value))

  def end_headers(self):
    self.wfile.write('\\r\\n')

  def sendStdHdrs(self, header_list=[], cachectrl='private',
                                        mimetype='text/html'):
    if not mimetype:
      mimetype = 'application/octet-stream'
    if mimetype.startswith('text/') and ';' not in mimetype:
      mimetype += '; charset=utf-8'
    self.send_header('Cache-Control', cachectrl)
    self.send_header('Content-Type', mimetype)
    for header in header_list:
      self.send_header(header[0], header[1])
    self.end_headers()

  def sendChunk(self, chunk):
    if self.chunked:
      self.wfile.write('%x\\r\\n' % len(chunk))
      self.wfile.write(chunk)
      self.wfile.write('\\r\\n')
    else:
      self.wfile.write(chunk)

  def sendEof(self):
    if self.chunked and not self.suppress_body: self.wfile.write('0\\r\\n\\r\\n')

  def sendResponse(self, message, code=200, msg='OK', mimetype='text/html',
                         header_list=[], chunked=False, length=None,
                         cachectrl='private'):
    self.server.logger.log_request(self, code, message and len(message) or '-')
    self.wfile.write('HTTP/1.1 %s %s\\r\\n' % (code, msg))
    if code == 401:
      self.send_header('WWW-Authenticate',
                       'Basic realm=PK%d' % (time.time()/3600))

    self.chunked = chunked
    if chunked:
      self.send_header('Transfer-Encoding', 'chunked')
    else:
      if length:
        self.send_header('Content-Length', length)
      elif not chunked:
        self.send_header('Content-Length', len(message or ''))

    self.sendStdHdrs(header_list=header_list,
                     mimetype=mimetype,
                     cachectrl=cachectrl)
    if message and not self.suppress_body:
      self.sendChunk(message)

  def do_HEAD(self):
    self.suppress_body = True
    self.do_GET(command='HEAD')

  def do_GET(self, command='GET'):
    (scheme, netloc, path, params, query, frag) = urlparse(self.path)
    qs = parse_qs(query)
    self.post_data = None
    self.command = command
    try:
      if 'cookie' in self.headers:
        cookies = Cookie.SimpleCookie(self.headers['cookie'])
      else:
        cookies = {}
      return self.handleHttpRequest(scheme, netloc, path, params, query, frag,
                                    qs, None, cookies)
    except socket.error:
      pass
    except:
      print '%s' % traceback.format_exc()
      self.sendResponse('<h1>Internal Error</h1>\\n', code=500, msg='Error')

  def do_PUT(self):
    self.do_POST(command='PUT')

  def do_DELETE(self):
    self.do_POST(command='DELETE')

  def header(self, name, default=None):
    return self.headers.get(name) or self.headers.get(name.lower()) or default

  def do_POST(self, command='POST'):
    (scheme, netloc, path, params, query, frag) = urlparse(self.path)
    qs = parse_qs(query)

    self.command = command
    self.post_data = tempfile.TemporaryFile()
    self.old_rfile = self.rfile
    try:
      # First, buffer the POST data to a file...
      clength = cleft = int(self.header('Content-Length'))
      while cleft > 0:
        rbytes = min(64*1024, cleft)
        self.post_data.write(self.rfile.read(rbytes))
        cleft -= rbytes

      # Juggle things so the buffering is invisble.
      self.post_data.seek(0)
      self.rfile = self.post_data

      ctype, pdict = cgi.parse_header(self.header('Content-Type', ''))
      if ctype == 'multipart/form-data':
        self.post_data.seek(0)
        posted = cgi.parse_multipart(self.rfile, pdict)

      elif ctype == 'application/x-www-form-urlencoded':
        if clength >= 50*1024*1024:
          raise Exception((\"Refusing to parse giant posted query \"
                           \"string (%s bytes).\") % clength)
        posted = cgi.parse_qs(self.rfile.read(clength), 1)

      elif command == 'POST':
        # We wrap the XMLRPC request handler in _BEGIN/_END in order to
        # expose the request environment to the RPC functions.
        rci = self.server.xmlrpc
        return rci._END(SimpleXMLRPCRequestHandler.do_POST(rci._BEGIN(self)))

      else:
        posted = {}
        posted[command.upper()] = self.rfile.read(clength)

      self.post_data.seek(0)
    except:
      print '%s' % traceback.format_exc()
      self.sendResponse('<h1>Internal Error</h1>\\n', code=500, msg='Error')
      self.rfile = self.old_rfile
      self.post_data = None
      return

    try:
      if 'cookie' in self.headers:
        cookies = Cookie.SimpleCookie(self.headers['cookie'])
      else:
        cookies = {}
      return self.handleHttpRequest(scheme, netloc, path, params, query, frag,
                                    qs, posted, cookies)
    except socket.error:
      pass
    except:
      print '%s' % traceback.format_exc()
      self.sendResponse('<h1>Internal Error</h1>\\n', code=500, msg='Error')

    self.rfile = self.old_rfile
    self.post_data = None

  def handleHttpRequest(self, scheme, netloc, path,
                              params, query, frag, qs, posted, cookies):
    return self.server.boss.handleHttpRequest(self, scheme, netloc, path,
                                              params, query, frag,
                                              qs, posted, cookies)


class XmlRpcInterface:
  \"\"\"Base class for handling XML-RPC methods.\"\"\"

  def __init__(self, boss):
    self.lock = threading.Lock()
    self.request = None
    self.boss = boss

  def _BEGIN(self, request_object):
    self.lock.acquire()
    self.request = request_object
    return request_object

  def _END(self, rv=None):
    if self.request:
      self.request = None
      self.lock.release()
    return rv


class Boss:
  \"\"\"Stub boss class.\"\"\"

  def handleHttpRequest(self, request_handler,
                              scheme, netloc, path, params, query, frag,
                              qs, posted, cookies):
    request_handler.sendResponse('<h1>Hello world</h1>')


class Logger:
  \"\"\"Stub logger class.\"\"\"

  def log_message(self, request_handler, message):
    if request_handler:
      return request_handler.log_message(message)
    print '*** %s' % message

  def log_request(self, request_handler, code, message):
    return request_handler.log_request(code, message)


class Server(SocketServer.ThreadingMixIn, SimpleXMLRPCServer):
  \"\"\"Basic HTTP daemon class.\"\"\"

  def __init__(self, sspec, boss,
               handler=RequestHandler,
               logger=Logger,
               xmlrpc=None):
    SimpleXMLRPCServer.__init__(self, sspec, handler)
    self.boss = boss
    self.handler = handler
    self.logger = logger()
    if xmlrpc:
      self.xmlrpc = xmlrpc(boss)
      self.register_introspection_functions()
      self.register_instance(self.xmlrpc)
    else:
      self.xmlrpc = None

  def finish_request(self, request, client_address):
   try:
     SimpleXMLRPCServer.finish_request(self, request, client_address)
   except socket.error:
     pass


if __name__ == \"__main__\":
  Server( ('localhost', 7890), Boss() ).serve_forever()

"""
sys.modules["HttpdLite"] = imp.new_module("HttpdLite")
sys.modules["HttpdLite"].open = __comb_open
exec __FILES[".SELF/../HttpdLite/HttpdLite.py"] in sys.modules["HttpdLite"].__dict__


###############################################################################
#!/usr/bin/python
#
# Unhosted.py, Copyright 2012, Bjarni R. Einarsson <http://bre.klaki.net/>
#
# This is an "instant" personal Unhosted.org remoteStorage server.
#
################################################################################
#
# This program is free software: you can redistribute it and/or modify it under
# the terms of the  GNU  Affero General Public License as published by the Free
# Software Foundation, either version 3 of the License, or (at your option) any
# later version.
#
# This program is distributed in the hope that it will be useful,  but  WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see: <http://www.gnu.org/licenses/>
#
################################################################################
#
import hashlib
import json
import os
import random
import re
import time
import urllib

import HttpdLite


html_escape_table = {
  "&": "&amp;",
  '"': "&quot;",
  "'": "&apos;",
  ">": "&gt;",
  "<": "&lt;",
}
def html_escape(text):
  """Produce entities within text."""
  return "".join(html_escape_table.get(c,c) for c in text)

def sha1sig(parts):
  h = hashlib.sha1()
  h.update(('-'.join(parts)).encode('utf-8'))
  return h.digest().encode('base64').replace('+', '^').replace('=', '').strip()



class RequestHandler(HttpdLite.RequestHandler):
  def do_OPTIONS(self):
    return self.do_GET(command='OPTIONS')


class Unhosted:
  def __init__(self, db_path):
    self.db_path = db_path
    self.db_metadata = {}
    self.db_password =  '' #'%x-%x' % (os.getpid(), random.randint(0, 0xFFFF))
    self.listen_on = ('localhost', 6789)

  def stop(self):
    pass

  METADATA_FILE = '_RS_METADATA.js'
  METADATA_TARGET_SIZE = 256*1024
  METADATA_NO_INLINE_RE = re.compile('^..*\.[a-zA-Z0-9]{2,5}$')

  CORS_HEADERS = [
    ('Access-Control-Allow-Origin', '*'),
    ('Access-Control-Allow-Methods', 'GET, PUT, DELETE'),
    ('Access-Control-Allow-Headers', 'content-length, authorization')
  ]
  HOST_META = """<?xml version='1.0' encoding='UTF-8'?>
<XRD xmlns='http://docs.oasis-open.org/ns/xri/xrd-1.0'>
  <Link rel='lrdd' type='application/xrd+xml'
                   template='%(proto)s://%(host)s/webfinger?uri={uri}'/>
</XRD>
"""
  WEBFINGER = """<?xml version='1.0' encoding='UTF-8'?>
<XRD xmlns='http://docs.oasis-open.org/ns/xri/xrd-1.0'>
  <Link rel='remoteStorage'
        api='simple'
        auth='%(unhosted_url)s/oauth?user=%(q_user)s'
        template='%(unhosted_url)s/storage/%(q_user)s/{category}/' />
</XRD>
"""

  def handleHttpRequest(self, req, scheme, netloc, path,
                              params, query, frag,
                              qs, posted, cookies, user=None):
    print "Hossa"+path
    if path.startswith('/'): path = path[1:]
    path_url = path
    path = urllib.unquote(path).decode('utf-8')

    # Defaults, may be overridden by individual response pages
    code = 200
    headers = self.CORS_HEADERS[:]
    cachectrl = 'no-cache'
    data = None

    # Shared values for rendering templates
    host = req.header('Host', 'unknown')
    page = {
      'proto': 'https', # FIXME
      'host': host,
    }
    page['unhosted_url'] = '%(proto)s://%(host)s' % page
    # host meta
    if req.command == 'GET' and path == '.well-known/host-meta':
      mime_type = 'application/xrd+xml'
      template = self.HOST_META

    elif req.command == 'GET' and path == 'webfinger':
      # FIXME: Does user really exist?
      page['subject'] = subject = qs['uri'][0]
      page['user'] = subject.split(':', 1)[-1].replace('@'+host, '')
      mime_type = 'application/xrd+xml'
      template = self.WEBFINGER.replace('\n', '\r\n')

    elif path == 'oauth':
      return self.handleOAuth(req, page, qs, posted)

    elif path.startswith('storage/'):
      return self.handleStorage(req, path[8:], page, qs, posted)

    else:
      code = 404
      mime_type = 'text/html'
      template = '<h1>404 Not found</h1>\n'

    if not data:
      for key in page.keys():
        page['q_%s' % key] = urllib.quote(page[key])
    return req.sendResponse(data or ((template % page).encode('utf-8')),
                            code=code, mimetype=mime_type,
                            header_list=headers, cachectrl=cachectrl)

  OAUTH_GRANT = """<!DOCTYPE html>
<html><head>
  <title>OAuth: Grant access?</title>
</head><body><form method='POST'>
  <h1>Grant access?</h1>
  <p>The app at <b>%(h_client_id)s</b> would like to read and write
     data for <b>%(h_user)s</b>.  Please log in and tick all permissions
     you'd like to grant to this app.  Note that some applications may fail
     if not all are granted.</p>
  <table><tr>
    <th>Read</th><th>Write</th><th>Category</th>%(rw_scopes)s
  </tr></table>
  <p>Password: <input type='password' name='password' value=''>
     <i>* check the console</i></p>
  <p><input type=submit value='Allow'>
     <input type=submit name='deny' value='Deny'></p>
</form></body></html>
"""
  OAUTH_SCOPE = """
  </tr><tr>
    <td><input type='checkbox' name='r_%(cat)s' checked></td>
    <td><input type='checkbox' name='w_%(cat)s' checked></td>
    <td><b>%(scope)s</b></td>"""

  def handleOAuth(self, req, page, qs, posted):
    page['user'] = subject = qs['user'][0]
    page['client_id'] = client_id = qs['client_id'][0]
    redirect_uri = qs['redirect_uri'][0]
    response_type = qs['response_type'][0]
    state = qs.get('state', [None])[0]

    scope = qs.get('scope', [None])[0]
    scope = scope and scope.split(',') or []

    if posted:
      redirect = None
      if 'deny' in posted:
        redirect = '%s#error=invalid_client' % redirect_uri
      elif posted.get('password', [''])[0] == self.db_password:
        parts = []
        print '%s' % posted
        for i in range(0, len(scope)):
          if ('r_%s' % i) in posted:
            parts.append('r_%s' % scope[i])
          if ('w_%s' % i) in posted:
            parts.append('w_%s' % scope[i])
        if parts:
          parts.extend([subject])
          parts.append(sha1sig([self.db_password]+parts))
          token = ','.join(parts)
          redirect = ('%s#access_token=%s&token_type=bearer'
                      ) % (redirect_uri, token)
        else:
          redirect = '%s#error=invalid_request' % redirect_uri

      if redirect:
        req.sendResponse(('<h1>Redirecting to <a href="%s">%s</a></h1>'
                          ) % (redirect, redirect),
                         code=302,
                         header_list=[('Location', redirect)])

    scope_html = []
    for cat in range(0, len(scope)):
      scope_html.append(self.OAUTH_SCOPE % {'cat': cat,
                                            'scope': html_escape(scope[cat])})
    page['rw_scopes'] = ''.join(scope_html)

    print
    print '*** YOUR TEMPORARY PASSWORD: %s' % self.db_password
    print

    for key in page.keys():
      page['h_%s' % key] = html_escape(page[key])
    return req.sendResponse((self.OAUTH_GRANT % page).encode('utf-8'),
                            code=500)

  def checkAuth(self, req, user):
    try:
      how, parts = req.header('Authorization', ' ').split()
      if how.lower() != 'bearer': raise ValueError(how)
      parts = parts.split(',')
      sig = parts.pop(-1)
      if sig != sha1sig([self.db_password]+parts): raise ValueError('sig')
      if parts.pop(-1) != user: raise ValueError(user)
      print 'Creds: %s' % parts
      return parts
    except (ValueError, KeyError), e:
      return ['r_public', 'error_%s' % e]

  def mkdir(self, path):
    dirname = os.path.dirname(path)
    if not os.path.exists(dirname): self.mkdir(dirname)
    os.mkdir(path)

  def getMetadata(self, dirname):
    if dirname in self.db_metadata:
      return self.db_metadata[dirname]
    try:
      fn = os.path.join(dirname, self.METADATA_FILE)
      md = json.load(open(fn, 'rb'))
      md[self.METADATA_FILE] = {
        'bytes': os.path.getsize(fn)
      }
      self.db_metadata[dirname] = md
    except (OSError, IOError):
      md = {}
    return md

  def setMetadata(self, dirname, key, value):
    md = self.getMetadata(dirname)
    md[key] = value
    self.saveMetadata(dirname, md)

  def delMetadata(self, dirname, key, value):
    md = self.getMetadata(dirname)
    if key in md:
      del md[key]
      self.saveMetadata(dirname, md)

  def saveMetadata(self, dirname, md):
    # FIXME: Use zlib to make this smaller?
    # FIXME: Just mark dirty, move the actual writes to another thread.
    json.dump(md, open(os.path.join(dirname, self.METADATA_FILE), 'wb'), indent=2)

  def getFile(self, filename, authenticated):
    dirname, basename = os.path.split(filename)
    metadata = self.getMetadata(dirname).get(basename, None)
    if not metadata:
      if authenticated and os.path.isdir(filename):
        return '{}', 'application/json', 200 # FIXME: Directory listing?
      else:
        return '<h1>Not Found</h1>\n', 'text/html', 404

    if authenticated or 'r' in metadata.get('public', ''):
      mime_type = metadata.get('mime-type', 'text/plain')
      data = metadata.get('data', '')
      if 'file-name' in metadata:
        data = ''.join(open(os.path.join(dirname, metadata['file-name']), 'rb'
                            ).readlines())
    else:
      return '<h1>Unauthorized</h1>\n', 'text/html', 401

    return data, mime_type, 200

  def inlineFile(self, filename, size, rs_meta):
    # Check if the data is too big
    rs_meta_size = rs_meta.get(self.METADATA_FILE, {}).get('bytes', 0)
    if size > (self.METADATA_TARGET_SIZE-rs_meta_size)/10: return False

    # Simple heuristic to see if we have foo.bar style name
    if self.METADATA_NO_INLINE_RE.match(filename): return False

    # Small with a weird name: inlining is OK.
    return True

  def putFile(self, filename, data, mime_type, authenticated):
    dirname, basename = os.path.split(filename)
    rs_metadata = self.getMetadata(dirname)
    if authenticated:
      if not os.path.exists(dirname): self.mkdir(dirname)
    else:
      if 'w' not in rs_metadata.get(basename, {}).get('public', ''):
        return '<h1>Unauthorized</h1>\n', 'text/html', 401

    if data == '' and not mime_type:
      os.mkdir(filename)
    else:
      metadata = {
        'mime-type': mime_type or 'application/octet-stream'
      }
      if not self.inlineFile(basename, len(data), rs_metadata):
        fn = metadata['file-name'] = urllib.quote(basename)
        fd = open(os.path.join(dirname, fn), 'wb')
        fd.write(data)
        fd.close()
      else:
        metadata['data'] = data
      self.setMetadata(dirname, basename, metadata)

    # FIXME: Return codes?
    return '', 'text/plain', 200

  def delFile(self, filename, authenticated):
    dirname, basename = os.path.split(filename)
    metadata = self.getMetadata(dirname).get(basename, None)
    if not metadata or not authenticated:
      return '<h1>Not Found</h1>\n', 'text/html', 404

    if 'file-name' in metadata:
      os.remove(os.path.join(dirname, metadata['file-name']))
    self.delMetadata(dirname, basename)

    return '', 'text/html', 200


  def handleStorage(self, req, path, page, qs, posted):
    headers = self.CORS_HEADERS[:]
    cachectrl = 'no-cache'

    # Clean up our path a bit...
    if '..' in path: raise ValueError('Evil path: %s' % path)

    # Calculate our filename
    filename = os.path.normpath('/'.join([self.db_path, path]))

    # Strip user and category off the path
    user, category, path = path.split('/', 2)
    creds = self.checkAuth(req, user)

    if req.command == 'OPTIONS':
      data, mime_type, code = '', 'text/html', 200

    elif req.command == 'GET':
      authenticated = ('r_%s' % category) in creds
      data, mime_type, code = self.getFile(filename, authenticated)

    elif req.command == 'PUT':
      authenticated = ('w_%s' % category) in creds
      data, mime_type, code = self.putFile(filename, posted['PUT'],
                                           req.header('Content-Type'),
                                           authenticated)

    elif req.command == 'DELETE':
      authenticated = ('w_%s' % category) in creds
      data, mime_type, code = self.delFile(filename, authenticated)

    else:
      data, mime_type, code = 'Unimplemented', 'text/html', 500

    return req.sendResponse(data, code=code, mimetype=mime_type,
                            header_list=headers, cachectrl=cachectrl)


if __name__ == "__main__":
  try:
    db_path = os.path.expanduser('~/.Unhosted.py')
    unhosted = Unhosted(db_path)
  except (IndexError, ValueError, OSError, IOError):
    print 'Usage: %s' % sys.argv[0]
    print
    print 'The file will create an database in: %s' % db_path
    print
    sys.exit(1)
  try:
    try:
      print 'This is Unhosted.py, listening on %s:%s' % unhosted.listen_on
      print 'Fork me on Github: https://github.com/pagekite/plugins-pyUnhosted'
      print
      HttpdLite.Server(unhosted.listen_on, unhosted,
                       handler=RequestHandler).serve_forever()
    except KeyboardInterrupt:
      unhosted.stop()
  except:
    unhosted.stop()
    raise



#EOF#

