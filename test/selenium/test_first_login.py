import unittest
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.keys import Keys
import time
import os
import remote_storage_server
from remote_storage_server import Unhosted,HttpdLite,RequestHandler
from threading import Thread
from multiprocessing import Process
from tempfile import mkdtemp

# lsof -i tcp:6789
class ServerThread(Process):
    def run(self):
        db_path =  mkdtemp('remote-storage') #os.path.expanduser('~/.Unhosted.py')
        print db_path
        self.unhosted = Unhosted(db_path)
        unhosted = self.unhosted
        print 'This is Unhosted.py, listening on %s:%s' % unhosted.listen_on
        self.server = HttpdLite.Server(unhosted.listen_on, unhosted,
                       handler=RequestHandler).serve_forever()


class TestFirstLogin(unittest.TestCase):
    browser = None
    
    @classmethod
    def setUpClass(cls):
        cls.rsServer = ServerThread()
        cls.rsServer.start()
        
        browser = webdriver.Firefox() # Get local session of firefox
        cls.browser = browser
        browser.implicitly_wait(3)
        browser.get("http://localhost:8000/app/index.html#/login") # Load page
        elem = browser.find_element_by_id("remoteStorageID") # Find the login box
        elem.send_keys("shybyte@localhost.net" + Keys.RETURN)
        tryCounter = 0
        while tryCounter < 5 and len(browser.window_handles) < 2:
            print(len(browser.window_handles))
            time.sleep(0.5)
            tryCounter += 1
        browser.switch_to_window(browser.window_handles[1])
        #assert "Grant" in browser.title
        allowButton = browser.find_element_by_xpath("//input[@value='Allow']")
        allowButton.click()
        browser.switch_to_window(browser.window_handles[0])

        
    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.rsServer.terminate()
    
    def setUp(self):
        self.browser = TestFirstLogin.browser
        browser = self.browser
        try:
            self.assertPageTitle("Friends' Stuff")
            browser.find_element_by_link_text('My Account')
        except Exception:
            self.fail("Login failed.")

    def tearDown(self):
        pass

    def test_login(self):
        browser = self.browser
        
        self.clickLink("Friends' Stuff");
        self.assertLink('add shybyte')

        self.clickLink('My Stuff');
        self.assertPageTitle('My Stuff');
        self.assertH3('Add Stuff')
        
        self.clickLink('Share Stuff');
        self.assertPageTitle('Share your Stuff');        
        self.assertLink('add some stuff');        

        self.clickLink('Friends');
        self.assertPageTitle('My Friends');        
        self.assertH3('Add Friend')

        self.clickLink('My Account');
        self.assertPageTitle('Account / Profile');
        self.assertInput('email','')

        self.clickLink('About');
        self.assertPageTitle('What is Shared Stuff?');        
    
    def assertLink(self,linkText):
            self.getLink(linkText)
        
    def clickLink(self,linkText):
            self.getLink(linkText).click()
            
    def getLink(self,linkText):
            return self.browser.find_element_by_link_text(linkText);            
            
    def assertPageTitle(self,pageTitle):
            self.browser.find_element_by_xpath('//h2[contains(.,"%s")]' % pageTitle)

    def assertInput(self,inputElementId,expectedValue):
        el = self.browser.find_element_by_xpath("//input['@id=%s']" % inputElementId)
        self.assertEquals(expectedValue,el.get_attribute('value'))

    def assertH3(self,text):
            self.browser.find_element_by_xpath('//h3[contains(.,"%s")]' % text)
        



if __name__ == '__main__':
    unittest.main()

