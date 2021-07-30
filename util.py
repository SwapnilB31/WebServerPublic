import urllib.request as u
import urllib.error as err
import mysql.connector as conn
import json
from datetime import datetime, date, timedelta
from random import randint
from config import get_config

config_obj = get_config()

<<<<<<< HEAD
version = config_obj["version"]
host_url = config_obj[version]["host"] + "/"
dbpass = config_obj[version]["dbpass"]
=======
#Sets the mysql password for the debug and release builds
if version == "debug":
    dbpass = "test123"
elif version == "release":
    dpass = ""
else:
    dbpass = ""
>>>>>>> 93a74e0334a55f105ecdd1bbbaa2a1f94f9079d0

# fetches the list of AD Users from the API in the Windows Server and inserts/synchronizes the data to be consistent
# with the AD state
def fetch_all_addUser():
    global host_url
    try:
        request_url = u.urlopen(host_url + "getAllADUsers")
    except err.URLError as e:
        print(e.reason)
        return False

    data = json.loads(request_url.read())
    db = conn.connect(host="localhost", user="root", password=dbpass, database="ad")

    cursor = db.cursor()

    for user_dict in data:

        sid = user_dict["SID"]
        cursor.execute("SELECT * FROM `aduser` WHERE `SID` = '%s'" % (sid))
        res = cursor.fetchall()
        if len(res) == 0:
            dist_names = user_dict["DistinguishedName"]
            parts = dist_names.split(",")

            enabled_str = user_dict["Enabled"]
            if enabled_str == "True":
                enabled = 1
            else:
                enabled = 0
            given_name = user_dict["GivenName"]
            name = user_dict["Name"]
            obj_class = user_dict["ObjectClass"]
            obj_guid = user_dict["ObjectGUID"]
            sam_acc_name = user_dict["SamAccountName"]
            surname = user_dict["Surname"]
            user_principal_name = user_dict["UserPrincipalName"]

            sql = "INSERT IGNORE INTO `aduser` (`Enabled`,`GivenName`,`Name`,`objectClass`,`objectGUID`,`SamAccountName`,`SID`,`Surname`,`UserPrincipalName`) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)"
            val = (
                enabled,
                given_name,
                name,
                obj_class,
                obj_guid,
                sam_acc_name,
                sid,
                surname,
                user_principal_name,
            )
            cursor.execute(sql, val)
            db.commit()

            for part in parts:
                field, param = part.split("=")
                print(field + " : " + param)
                if field == "CN":
                    sql = "INSERT IGNORE INTO cn(`name`) VALUES ('%s')" % (param)
                    cursor.execute(sql)
                    db.commit()

                    sql = (
                        "INSERT IGNORE INTO cnuserrel(`cnid`,`SID`) VALUES ((SELECT `id` FROM cn WHERE `name` = '"
                        + param
                        + "'),'%s')" % (sid)
                    )
                    cursor.execute(sql)
                    db.commit()

                elif field == "DC":
                    sql = "INSERT IGNORE INTO dc(`name`)  VALUES('%s')" % (param)
                    cursor.execute(sql)
                    db.commit()

                    sql = (
                        "INSERT IGNORE INTO dcuserrel(`dcid`,`SID`) VALUES ((SELECT `id` FROM dc WHERE `name` = '"
                        + param
                        + "'),'%s')" % (sid)
                    )
                    cursor.execute(sql)
                    db.commit()

                elif field == "OU":
                    sql = "INSERT IGNORE INTO ou(`name`)  VALUES('%s')" % (param)
                    cursor.execute(sql)
                    db.commit()

                    sql = (
                        "INSERT IGNORE INTO ouuserrel(`ouid`,`SID`) VALUES ((SELECT `id` FROM ou WHERE `name` = '"
                        + param
                        + "'),'%s')" % (sid)
                    )
                    cursor.execute(sql)
                    db.commit()

    cursor.close()
    return True


# fetches the list of AD Admins from the API in the Windows Server and inserts/synchronizes the data to be consistent
# with the AD state
def fetch_admin_principal_memberships():
    global host_url
    try:
        request_url = u.urlopen(host_url + "getPrincipalGroupMembership/admin")
    except err.URLError as e:
        print(e.reason)
        return False

    data = json.loads(request_url.read())
    db = conn.connect(host="localhost", user="root", password=dbpass, database="ad")

    cursor = db.cursor()

    for user_dict in data:

        sid = user_dict["SID"]
        cursor.execute("SELECT * FROM `adadmin` WHERE `SID` = '%s'" % (sid))
        res = cursor.fetchall()
        if len(res) == 0:
            dist_names = user_dict["distinguishedName"]
            parts = dist_names.split(",")

            group_cat = user_dict["GroupCategory"]
            group_scope = user_dict["GroupScope"]
            name = user_dict["name"]
            obj_class = user_dict["objectClass"]
            obj_guid = user_dict["objectGUID"]
            sam_acc_name = user_dict["SamAccountName"]

            sql = "INSERT IGNORE INTO `adadmin` (`GroupCategory`,`GroupScope`,`name`,`objectClass`,`objectGUID`,`SamAccountName`,`SID`) VALUES(%s,%s,%s,%s,%s,%s,%s)"
            val = (group_cat, group_scope, name, obj_class, obj_guid, sam_acc_name, sid)
            cursor.execute(sql, val)
            db.commit()

            for part in parts:
                field, param = part.split("=")
                print(field + " : " + param)
                if field == "CN":
                    sql = "INSERT IGNORE INTO cn(`name`) VALUES ('%s')" % (param)
                    cursor.execute(sql)
                    db.commit()

                    sql = (
                        "INSERT IGNORE INTO cnadminrel(`cnid`,`SID`) VALUES ((SELECT `id` FROM cn WHERE `name` = '"
                        + param
                        + "'),'%s')" % (sid)
                    )
                    cursor.execute(sql)
                    db.commit()

                elif field == "DC":
                    sql = "INSERT IGNORE INTO dc(`name`)  VALUES('%s')" % (param)
                    cursor.execute(sql)
                    db.commit()

                    sql = (
                        "INSERT IGNORE INTO dcadminrel(`dcid`,`SID`) VALUES ((SELECT `id` FROM dc WHERE `name` = '"
                        + param
                        + "'),'%s')" % (sid)
                    )
                    cursor.execute(sql)
                    db.commit()

                """elif field == "OU":
                    sql = "INSERT IGNORE INTO OU(`name`)  VALUES('%s')" % (param)
                    cursor.execute(sql)
                    db.commit()

                    sql = "INSERT IGNORE INTO OUUserRel(`ouid`,`SID`) VALUES ((SELECT `id` FROM OU WHERE `name` = '"+param+"'),'%s')" % (sid)
                    cursor.execute(sql)
                    db.commit()"""

    cursor.close()
    return True


# fetches the password expiry attribute for all AD Users and updates the correponding values in the database
def fetch_user_password_expiry():
    global host_url
    try:
        request_url = u.urlopen(host_url + "getPwdExpiry/All")
    except err.URLError as e:
        print(e.reason)
        return False

    data = json.loads(request_url.read())

    db = conn.connect(host="localhost", user="root", password=dbpass, database="ad")

    cursor = db.cursor()

    for key in data:
        if data[key] is not None:
            sql = "UPDATE `aduser` SET `PasswordExpiry` = '%s' WHERE `SID` = '%s'" % (
                data[key],
                key,
            )
            cursor.execute(sql)
            db.commit()
        else:
            sql = "UPDATE `aduser` SET `PasswordExpiry` = NULL WHERE `SID` = '%s'" % (
                key
            )
            cursor.execute(sql)
            db.commit()

    cursor.close()
    return True


# This methid calls the functions fetch_all_addUser(), fetch_admin_principal_memberships() and
# fetch_user_password_expiry() together to Update the Database with AD Data at once. This function is called
# by the fecthFromWinServer API Endpoint in server.py
def fetch_data():
    return (
        fetch_all_addUser()
        and fetch_user_password_expiry()
        and fetch_admin_principal_memberships()
    )


# sets the lastLoginAttribute for each user randomly as a date within the last ten days
def randomizeLastLogin():
    db = conn.connect(host="localhost", user="root", password=dbpass, database="ad")
    cursor = db.cursor()

    cursor.execute("SELECT `user_id` from `aduser` ORDER BY `user_id` ASC")
    res = cursor.fetchall()

    for i in range(len(res)):
        user_id = res[i][0]
        day_diff = randint(1, 10)
        last_login = datetime.now() + timedelta(days=-day_diff)
        last_login_str = last_login.strftime("%y-%m-%d %H:%M:%S")
        sql = "UPDATE `aduser` SET `lastLogin` = '%s' WHERE `user_id` = '%s'" % (
            last_login_str,
            user_id,
        )
        cursor.execute(sql)
        db.commit()

    cursor.close()
    return True


# sets the PasswordExpiry for each user randomly as a date in the range of 20 days from today, and 20 days
# before today
def randomizePasswordExpiry():
    db = conn.connect(host="localhost", user="root", password=dbpass, database="ad")
    cursor = db.cursor()

    cursor.execute("SELECT `user_id` from `aduser` ORDER BY `user_id` ASC")
    res = cursor.fetchall()

    for i in range(len(res)):
        user_id = res[i][0]
        day_diff = randint(-20, 20)
        last_login = datetime.now() + timedelta(days=day_diff)
        last_login_str = last_login.strftime("%y-%m-%d %H:%M:%S")
        sql = "UPDATE `aduser` SET `PasswordExpiry` = '%s' WHERE `user_id` = '%s'" % (
            last_login_str,
            user_id,
        )
        cursor.execute(sql)
        db.commit()

    cursor.close()
    return True

<<<<<<< HEAD

# print(randomizeLastLogin() and randomizePasswordExpiry())
=======
#print(randomizeLastLogin() and randomizePasswordExpiry())
>>>>>>> 93a74e0334a55f105ecdd1bbbaa2a1f94f9079d0
