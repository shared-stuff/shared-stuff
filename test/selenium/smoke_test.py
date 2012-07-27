import unittest
from selenium import webdriver
from selenium.webdriver.support.wait import  WebDriverWait
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.keys import Keys
import time
import os
import remote_storage_server
from remote_storage_server import Unhosted, HttpdLite, RequestHandler
from threading import Thread
from multiprocessing import Process
from tempfile import mkdtemp
from shutil import copytree

# lsof -i tcp:6789
class ServerThread(Process):
    def run(self):
        db_path = mkdtemp('remote-storage') #os.path.expanduser('~/.Unhosted.py')
        print db_path
        remoteStorageFixtureDataDir = os.path.dirname(os.path.realpath(__file__))+"/fixture-data/existing-user"
        print remoteStorageFixtureDataDir
        copytree(remoteStorageFixtureDataDir, db_path+'/existing-user')
        print remoteStorageFixtureDataDir
        
        self.unhosted = Unhosted(db_path)
        unhosted = self.unhosted
        print 'This is Unhosted.py, listening on %s:%s' % unhosted.listen_on
        self.server = HttpdLite.Server(unhosted.listen_on, unhosted,
                       handler=RequestHandler).serve_forever()

BASE_URL = 'http://localhost:8000/app/index.html#'

class TestSmokeTest(unittest.TestCase):
    browser = None
    
    @classmethod
    def setUpClass(cls):
        pass
    @classmethod
    def tearDownClass(cls):
        pass
    
    def setUp(self):
        self.rsServer = ServerThread()
        self.rsServer.start()
        
        browser = webdriver.Firefox() # Get local session of firefox
        self.browser = browser
        browser.implicitly_wait(3)
      
    def tearDown(self):
        self.browser.close()
        self.rsServer.terminate()
        time.sleep(0.5)
        pass

    def test_login_as_new_user(self):
        self.loginAs('new-user@localhost.net')
        browser = self.browser
        
        self.clickLink("Friends' Stuff");
        self.assertPageTitle("Friends' Stuff")
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
        self.assertValue('email', '')

        self.clickLink('About');
        self.assertPageTitle('What is Shared Stuff?');
        
    def test_login_as_existing_user(self):
        self.loginAs('existing-user@localhost.net')
        browser = self.browser
        
        self.clickLink("Friends' Stuff");
        self.assertPageTitle("Friends' Stuff")
        #self.assertLink('add shybyte')
        self.assertH3('Clean Code')

        self.clickLink("My Stuff");
        self.assertH3('Public Example Stuff')
        self.assertH3('Private Example Stuff')
        
        self.clickLink('Share Stuff')
        self.assertValue('inviteUrl', 'http://localhost:8000/app/index.html#existing-user@localhost.net/ZXR6GjcSmPJTtr3EwbVIg')
        self.assertValue('publicInviteUrl', 'http://localhost:8000/app/index.html#existing-user@localhost.net')

        self.clickLink('Friends')
        self.assertLink("Marco")
        
        self.clickLink('My Account');
        self.assertValue('name', 'Existing User')
        self.assertValue('email', 'existing-user@gmail.com')
        self.assertValue('location', 'Berlin')
        self.assertValue('image', 'https://lh5.googleusercontent.com/-fLRGKlGhTMw/T-3cqFxXmgI/AAAAAAAABZA/zdjyH0gfqWo/s800/profile.jpg')
        
    def test_login_from_invitation(self):
        browser = self.browser
        self.goto("existing-user@localhost.net") 
        self.clickButton('Login and Add Friend')
        self.assertPageTitle("Login")
        self.loginAs('new-user@localhost.net')
        
        self.assertPageTitle("My Friends")
        self.assertValue('name', 'Existing User')
        self.assertValue('userAddress', 'existing-user@localhost.net')
        

    def test_add_shybyte_as_friend(self):
        self.loginAs('new-user@localhost.net')
        self.clickLink("Friends' Stuff")
        self.clickLink('add shybyte')
        
        self.assertH2('Invitation from Marco')
        self.clickButton('Add to my friends')
        
        self.assertValue('name', 'Marco')
        self.assertValue('userAddress', 'shybyte@5apps.com')
        self.clickButton('Add Friend')

        self.clickLink("Marco")
        
        self.assertH2('Marco')
        self.clickLink("Friends' Stuff")
        
        self.assertH3('Clean Code')
        
        
    def test_add_and_share_stuff(self):
        self.loginAs('new-user@localhost.net')
        self.clickLink("My Stuff")
        
        # add private stuff
        privateExampleTitle = 'Private Example Stuff'
        self.assertH2('My Stuff')
        self.enter('title', privateExampleTitle)
        self.enter('description', 'Private Example Stuff Description')
        self.clickButton('Add Stuff')
        
        self.assertH3(privateExampleTitle)
        self.clickLink(privateExampleTitle)
        
        self.assertValue('title', privateExampleTitle)
        self.assertValue('description', 'Private Example Stuff Description')
        
        # add public stuff
        self.clickLink("My Stuff")
        self.assertH2('My Stuff')
        self.clickButton('Add Stuff')
        publicExampleTitle = 'Public Example Stuff'
        self.enter('title', publicExampleTitle)
        self.enter('description', 'Public Example Stuff Description')
        self.select('Public')
        self.clickButton('Add Stuff')
        
        self.assertH3(publicExampleTitle)
        self.assertTextInClass('stuffFooter','Public')
        
        


    def assertLink(self, linkText):
            self.getLink(linkText)
        
    def clickLink(self, linkText):
            self.getLink(linkText).click()

    def clickButton(self, text):
            button =  self.getButton(text)
            button.click()
    
    def getLink(self, linkText):
            return self.browser.find_element_by_link_text(linkText);            

    def getVisibleElement(self,xpath):
        def findVisible(driver):
            els = driver.find_elements_by_xpath(xpath)
            for el in els:
                if el.is_displayed():
                    return el
            return False
        return WebDriverWait(self.browser, 10).until(findVisible,'Can\'t find visible element %s' % xpath)

    def getButton(self, text):
            return self.getVisibleElement("//button[contains(.,'%s')]" % text);            
            
    def assertPageTitle(self, pageTitle):
            self.browser.find_element_by_xpath('//h2[contains(.,"%s")]' % pageTitle)

    def assertValue(self, inputElementId, expectedValue):
        def waitForInputValue(browser):
            el = browser.find_element_by_xpath("//*[@id='%s']" % inputElementId)
            #print "Found value %s for input element %s" % (el.get_attribute('value'),inputElementId)
            return expectedValue == el.get_attribute('value')
        WebDriverWait(self.browser, 10).until(waitForInputValue,'Can\'t find input element %s with value %s' % (inputElementId,expectedValue))

    def assertH3(self, text):
            self.browser.find_element_by_xpath('//h3[contains(.,"%s")]' % text)

    def assertH2(self, text):
            self.browser.find_element_by_xpath('//h2[contains(.,"%s")]' % text)
        
    def enter(self,inputElementId,text):
         el = self.browser.find_element_by_xpath("//*[@id='%s']" % inputElementId)
         el.send_keys(text)
         
    def select(self,optionText):
         el = self.browser.find_element_by_xpath("//option[contains(.,'%s')]" % optionText)
         el.click()  
    
    def assertText(self,text):
        self.browser.find_element_by_xpath("//body[contains(.,'%s')]" % text)

    def assertTextInClass(self,cssClass,text):
        self.browser.find_element_by_xpath("//*[contains(@class,'%s') and contains(.,'%s')]" % (cssClass,text))


    def loginAs(self,username):
        browser = self.browser
        self.goto("/login") # Load page
        elem = browser.find_element_by_id("remoteStorageID") # Find the login box
        elem.send_keys(username + Keys.RETURN)
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
        
        browser = self.browser
        try:
            browser.find_element_by_link_text('My Account')
        except Exception:
            self.fail("Login failed.")
            
    def goto(self,path):
        self.browser.get("%s%s" % (BASE_URL,path))

if __name__ == '__main__':
    unittest.main()

