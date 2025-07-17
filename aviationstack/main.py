from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium_stealth import stealth
import random
import string
import json
from pickledb import PickleDB
import random_address
import time

db = PickleDB("accounts.json")

def random_name():
    with open("aviationstack/first_names.json", "r") as f:
      first_names = json.load(f)
    with open("aviationstack/last_names.json", "r") as f:
      last_names = json.load(f)
    return {
        "first": random.choice(first_names['data']['withoutAccents']['male']),
        "last": random.choice(last_names['data']['withoutAccents'])
    }
def random_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for i in range(length))

browser_opts = Options()
browser_opts.add_experimental_option("excludeSwitches", ["enable-automation"])
browser_opts.add_experimental_option('useAutomationExtension', False)
browser_opts.add_argument("--disable-blink-features=AutomationControlled")
browser_opts.add_argument("--disable-infobars")
# firefox user agent
browser_opts.add_argument("Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0")
browser = webdriver.Chrome(options=browser_opts)
browser.maximize_window()
browser.get("https://aviationstack.com/signup/free")

cookies = browser.find_elements("xpath", '//*[@id="cookiescript_close"]')
if cookies:
    print("closing cookie popup")
    cookies[0].click()

names = random_name()
email = f"{names['first'].lower()}.{names['last'].lower()}@whatisham.eu.org"
passwd = random_password()
address = random_address.real_random_address_by_state("CA")

browser.find_element("id", "first_name").send_keys(names['first'])
browser.find_element("id", "last_name").send_keys(names['last'])

browser.find_element("id", "email").send_keys(email)
browser.find_element("id", "password").send_keys(passwd)

browser.find_element("id", "address_free").send_keys(address['address1'])
browser.find_element("id", "post_code_free").send_keys(address['postalCode'])

country_select = Select(browser.find_element("id", "country_code_free"))
country_select.select_by_visible_text("United States")
state_select = Select(browser.find_element("class name", "state-select"))
state_select.select_by_value("California")

browser.find_element("id", "city_free").send_keys(address['city'])

browser.execute_script("window.scrollTo(0, document.body.scrollHeight);")

input("Please complete the captcha and press Enter to continue...")

browser.find_element("class name", "signup_button_submit").click()

time.sleep(5)
browser.get("https://aviationstack.com/dashboard")

try:
    wait = WebDriverWait(browser, 15)
    accessKey = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert_inner")))
    access_key_text = accessKey.text
    print(f"Access Key: {access_key_text}")
except Exception as e:
    print(f"Could not find access key element: {e}")
    access_key_text = None

db.set(email, {
  "password": passwd,
  "access_key": access_key_text
})

db.save()