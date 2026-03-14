

# Winget-Serv [WIP]

## Introduction

### A custom script link creation tool.

#### What it does
- Create scripts from a Graphical Interface
- Make your script accesible from a link
- Execute it from wherever you like with one command

#### Why should I need it
One link, and you're ready.
Weither its for quick computer setup, or keeping quickly seting up your student workspaces.
One command similar to this one (Powershell example)
``irm https://<link>/script/Jkdèzl || iex``

And you're script will be executed.

#### Objectives
Making script creation more intuitive anc accesible.
Making a such sensitive media more accesible can mean to troubles.
That's why security measures, and constant reminder of script provider confiance will be bundled in the scripts.

---------------
## API Usage

### **User management**<br>
Under the ``http://{localhost}:{port}/user`` subpage

#### **Create user** ``/user/create`` *POST*
```json
{
    "username": "string",
    "email": "string",
    "password" : "string"
}
```
#### **Remove user** ``/user/remove`` *DELETE*<br>
*note, user role can only delete themselves, only the admin role need id*
```json
{
    "id": number
}
```

#### **Login** ``/user/login`` *POST*<br>
*by default a token last for 24h*
```json
{
    "username": "string", OR "email": "string",
    "password" : "string"
}
```


#### **Get user info***GET*
``/user/:id`` 
#### **Get current loggend in user info***GET*
``/user/me`` 
<br>
<br>
<br>

### **Script Management**<br>
### Under the ``http://{localhost}:{port}/script`` subpage

#### **Create script** ``/script/create`` *POST*
```json
{
    "name": "string",
    "description": "string, can be null",       //require authentification
    "content": JSON
}
```
#### **Remove script** ``/script/remove`` *DELETE*<br>
```json
{
    "id": number        //require authentification
}
```

#### **Execute / View script** *(on browser)* *GET*
``/script/:public_id`` 

#### **Get all script from user** *GET*
``/script/list`` *Require authentification*


---------

## Launch Parameters and Environement Variable

###### **Launch parameters** are prioritized over **Environement Variables**

*This list can be viewed form the --help flag*

#### ``--port=``
Change port that will be used by the server

#### ``--init=true``
Create all necesary database tables and columns

#### ``--token-expires-in=``
Control time of validity period of user tokens

#### ``--db-host=``
Domain or IP to database 

#### ``--db-port=``
Change **port** used for database connection

#### ``--db-login=``
Change **login** used for database connection

#### ``--db-passwd=``
Change **password** used for database** connection

#### ``--db-name=``

Change database name used for database connection and creation

