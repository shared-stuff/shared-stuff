# Setup for running the selenium tests

## Install Selenium Python

http://selenium.googlecode.com/svn/trunk/docs/api/py/index.html

    * pip install -U selenium
    * Download the server from http://selenium.googlecode.com/files/selenium-server-standalone-2.23.0.jar
    * java -jar selenium-server-standalone-2.23.0.jar



## Setup Apache HTTPS Reverse Proxy to the local Remote Storage Server (started by the tests)

This is needed in order to run easily a https server on port 403 which seems to be
needed by the remote storage protocol.

http://wiki.ubuntuusers.de/Apache/SSL
Create Certificate:

mkdir -p /etc/apache2/ssl
openssl req -new -x509 -days 365 -nodes -out /etc/apache2/ssl/apache.pem -keyout /etc/apache2/ssl/apache.pem
ln -sf /etc/apache2/ssl/apache.pem /etc/apache2/ssl/`/usr/bin/openssl x509 -noout -hash < /etc/apache2/ssl/apache.pem`.0
chmod 600 /etc/apache2/ssl/apache.pem


2012-06-26+02:37:21.2559685730 ./sites-available/ssl
2012-06-26+01:48:42.6134958050 ./sites-enabled/ssl
2012-06-26+01:48:42.6134958050 ./sites-enabled
2012-06-26+01:48:27.1574191610 ./httpd.conf
2012-06-26+01:47:12.7170500380 ./sites-available
2012-06-26+01:41:37.7433889900 ./mods-enabled/ssl.load
2012-06-26+01:41:37.7433889900 ./mods-enabled/ssl.conf
2012-06-26+01:41:37.7433889900 ./mods-enabled
2012-06-26+01:40:01.6909126930 ./ssl/112a397e.0
2012-06-26+01:40:01.6909126930 ./ssl
2012-06-26+01:39:48.6108478380 ./ssl/apache.pem
2012-06-26+01:38:10.3343605030 .
2012-06-26+01:27:05.2510625470 ./apache2.conf

2012-01-11+13:43:40.7109044630 ./mods-enabled/proxy_http.load
2012-01-11+13:43:32.7628650420 ./mods-enabled/proxy.conf
2012-01-11+13:43:27.1068370020 ./mods-enabled/proxy.load


./sites-enabled/ssl:

<virtualhost *:443>

    <Limit GET HEAD POST PUT DELETE OPTIONS>


    </Limit>

	ErrorLog ${APACHE_LOG_DIR}/ssl_error.log

	# Possible values include: debug, info, notice, warn, error, crit,
	# alert, emerg.
	LogLevel warn

	CustomLog ${APACHE_LOG_DIR}/ssl_access.log combined

        SSLEngine On
        SSLCertificateFile /etc/apache2/ssl/apache.pem
	ProxyPreserveHost On
	#ProxyPass / http://localhost:6789/
	#ProxyPassReverse / http://localhost:6789/
	ProxyPass / http://localhost:8080/
	ProxyPassReverse / http://localhost:8080/



</virtualhost>


## Modify /etc/hosts

Shared Stuff only likes domain names which like real ones

Add:
127.0.1.1	localhost.net


## Workaround if the port is already taken

lsof -i tcp:6789
and kill it