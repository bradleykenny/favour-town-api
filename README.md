# favour-town-api

## First time running this project:

1. Install nodejs from https://nodejs.org/en/
2. In project directory, run "npm i" to install all dependencies

Starting local server:

1. In project directory run "npm start"

## Interfaces

### GET /favours

#### Fields:

-   count : Parameter to specify how many favours to get. Defaults to 20

#### Return

Up to _count_ number of favours

### POST /favours

#### Fields:

-   user_id : The id of the user posting the favour (should replace with session id for when sessions are implemented in phase 2)
-   title : user specified title of the favour listing
-   location : location (suburb) of the user
-   description : Description of listing
-   coins : user specified value of the listing
-   type : "offer" or "request" depending on user choice

#### Return

"OK" to confirm listing has been posted

### POST /login

#### Fields:

-   username : self-explainatory
-   password : unencrypted password. Encryption yet to be confirmed on sql or api layer.

#### Return

user_id, to be used for user actions (e.g. posting favours)

### POST /register

#### Fields:

-   f_name  : first name
-   l_name  : last name
-   username : self-explainatory
-   password : unencrypted password. Encryption yet to be confirmed on sql or api layer.
-   email   : self-explainatory

#### Return

"OK" to confirm user has been registered

### GET /listings

#### Fields:

-   username : Parameter to specify which listings by a given username

#### Return

username, favour title, user id, favour id

### GET /profile

#### Fields:

-   username : Parameter to specify which user's information to retreive

#### Return

username, user id, email addr, favour counters, favour listings

## Issues

Tell Anthony or John of any issues with the project
