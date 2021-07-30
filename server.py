import re
from flask import *
import mysql.connector as conn
import json
import util
from config import get_config
from Graph import Graph
import urllib.request as u
import urllib.error as err

g = Graph()

config_obj = get_config()

# Sets the mysql password for the debug and release builds
version = config_obj["version"]
host = config_obj[version]["host"]
dbpass = config_obj[version]["dbpass"]

app = Flask(__name__)
app.secret_key = "#12_678_1_bhc"

# returns the home page if logged in, redirects to the Login Page otherwise
@app.route("/")
def home():
    if "logged_in" in session:
        return send_from_directory("static", "home.html")
    else:
        return redirect(url_for("login"))


# returns the static files for the web application, contained un the static folder as raw file data
@app.route("/<path:path>")
def home_files(path):
    return send_from_directory("static", path)


# handles user login
# if HTTP Method is GET: sends the HTML page for User Login
# else: authenticates the username and password sent over by the user and returns the homepage
#      in case of successful authentication; returns the login page in case of failed authentication
@app.route("/login", methods=["POST", "GET"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        if username == "root" and password == "testroot123":
            session["logged_in"] = True
            return redirect(url_for("home"))
        else:
            return redirect(url_for("login"))
    else:
        return send_from_directory("static", "login.html")


@app.route("/showNetworkGraph")
def show_graph():
    return send_from_directory("static", "graph.html")


# logs the user out of the system and clears the session variables
@app.route("/logout")
def logout():
    if "logged_in" in session:
        session.pop("logged_in", None)
    return redirect(url_for("login"))


# returns the lis of ADUsers and their corresponding attributes from the database as a JSON object
@app.route("/getADUsers")
def getADUsers():
    db = conn.connect(host="localhost", user="root", password=dbpass, database="ad")
    cursor = db.cursor()

    sql = "SELECT `Enabled`,`GivenName`,`Name`,`objectClass`,`objectGUID`,`SamAccountName`,`SID`,`Surname`,`UserPrincipalName`, `PasswordExpiry`, `lastLogin` FROM `aduser`"
    cursor.execute(sql)

    result = cursor.fetchall()

    json_data = json.dumps(result, default=str)

    return json_data


# returns the lis of ADAdmins and their corresponding attributes from the database as a JSON object
@app.route("/getADAdminMemberships")
def getADAdminMemberships():
    db = conn.connect(host="localhost", user="root", password=dbpass, database="ad")
    cursor = db.cursor()

    sql = "SELECT `GroupCategory`,`GroupScope`,`name`,`objectClass`,`objectGUID`,`SamAccountName`,`SID` FROM `adadmin`"
    cursor.execute(sql)

    result = cursor.fetchall()

    json_data = json.dumps(result)

    return json_data


# The API Endpoint calls the fetch_data() method from the util.py module to sync the data between windows server
# and the MySQL database when it recives a GET request
@app.route("/fetchFromWinServer")
def fetchFromWinServer():
    res = {}
    res["fetch"] = util.fetch_data()
    return json.dumps(res)


# calls the randomizeLastLogin() method from util.py and randomizes the lastLogin attribute for ad users
@app.route("/randomizeLastLog")
def randomizeFields1():
    res = {}
    res["post"] = util.randomizeLastLogin()
    return json.dumps(res)


# calls the randomizePasswordExpiry() method from util.py and randomizes the PasswordExpiry attribute for ad users
@app.route("/randomizePassExp")
def randomizeFields2():
    res = {}
    res["post"] = util.randomizePasswordExpiry()
    return json.dumps(res)


# makes sql queries to determine the following statistics for AD Users:
# 1. Total Number of ADUsers
# 2. Total Number of Groups
# 3. Average group membership for AD Users
# 4. Number of users that logged in during the last week
# 5. Number of users that logged in during the last 30 days
@app.route("/statsSummary")
def statsSummary():
    db = conn.connect(host="localhost", user="root", password=dbpass, database="ad")
    cursor = db.cursor()

    sql = "select count(*) as total_users from aduser;"
    cursor.execute(sql)

    result = cursor.fetchall()
    res = {}
    res["num_users"] = result[0][0]

    sql = "select avg(num_groups) as avg_group from aduser;"
    cursor.execute(sql)

    result = cursor.fetchall()
    res["avg_group"] = result[0][0]

    sql = "select count(*) from (select * from aduser where PasswordExpiry < CURDATE()) as t;"
    cursor.execute(sql)

    result = cursor.fetchall()
    res["num_expired"] = result[0][0]

    sql = "select count(*) as login_count from (select * from aduser where datediff(CURDATE(),lastLogin) <= 7) as t;"
    cursor.execute(sql)

    result = cursor.fetchall()
    res["login_count"] = result[0][0]

    sql = "select count(*) as login_count from (select * from aduser where datediff(CURDATE(),lastLogin) <= 30) as t;"
    cursor.execute(sql)

    result = cursor.fetchall()
    res["login_count_30"] = result[0][0]

    return json.dumps(res, default=str)


@app.route("/getAdjacencyList")
def get_adjacency_list():
    if g.loaded:
        data = g.adjacency_list
    else:
        data = g.build_adjacency_list()

    output = json.dumps(data, default=str, indent=1)
    print(output)
    return output


@app.route("/getNestingInfo")
def get_nesting_info():
    max, total = g.get_max_and_total_nesting()
    num_groups = len(list(g.adjacency_list.keys()))

    output = {"max": max, "total": total, "num_groups": num_groups}

    return json.dumps(output, default=str)


@app.route("/getPermissions/<user_name>")
def get_permissions(user_name):
    permissions = []
    try:
        # print(host + "/getPermssions/" + user_name)
        request_url = u.urlopen(host + "/getPermissions/" + user_name)
    except err.URLError as e:
        print(e.reason)
        return permissions
    permissions = request_url.read()
    # print(permissions)
    return permissions


# starts the server on port 80 and accepts requests from all requesting IP Addreses
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
