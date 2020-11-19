# KS Hire API

Below we will define how to install & interact with the KS Hire API. All API actions that require an authenticated user require a Bearer token in the headers containing a JWT provided when you login/register

- [Installation](#Installation)
- [Users](#Users)
- [Documents](#Documents)
- [Roles](#Roles)
- [Jobs](#Jobs)
- [Candidates](#Candidates)
- [Feedback](#Feedback)
- [Notes](#Notes)

**Note**: This is _not_ the final API documentation. Breaking changes will be rolling out regularly as basic development continues.

---

# Installation

### Requirements

Be sure you have installed the following:

- docker-ce
- docker-compose

#### Optional Requirements

Be sure to install the following if you're planning to contribute to this repository.

- nodejs (for npm)

Install the project requirements so the IDE works as expected.

```
npm i
```

### Quickstart

1. Run the proxy container

```docker
docker network create proxy
docker run -d -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock:ro --restart=always --name proxy --network proxy jwilder/nginx-proxy
```

2. Update your hosts file with the the corresponding IP (Ubuntu 0.0.0.0 - macOS 127.0.0.1)

`sudo bash -c "echo '[HOST_IP] hire.ksquareinc.test' >> /etc/hosts"`

3. Start the project

```sh
make start
make docker-populate
```

If you are in a UNIX system use `make` to run the scripts, and if you are in windows install make (Ex. `choco install make`)

You must login with the following credentials for admin usage

The `make start` commands detect the source folder in order to start the project in **_PROD or DEV mode_**, in order to work correctly the
folders **should end** with **"-dev"** or **"-prod"** respectively

```
user: admin@example.com
password: adminadmin
```

### Core Commands

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `make start`           | Start production containers in detached mode     |
| `make stop`            | Stop production containers but don't remove them |
| `make docker-populate` | Populate a running container with test data      |
| `make help`            | Get more information about all existing commands |

And viola!

# Users

#### ~ Register

Already registered users can log in with a POST call to:

    /api/v1/auth/register

The body of the POST request should consist of the following JSON:

```json
{
  "email": "admin@example.com",
  "name": "Señor Admin",
  "password": "adminadmin",
  "role": "admin"
}
```

The response looks like this:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywic3ViIjoiYWNjZXNzIiwiYXVkIjoidXNlciIsImV4cCI6MTU4NDk3Njc4NTg5MCwiaWF0IjoxNTc5NzkyNzg1ODkwLCJqdGkiOiJhYmM0YTI3OS0yY2M5LTRlMGMtYmFjMC1hNWE5NGEwMjVkMTUiLCJlbWFpbCI6ImFkbWlAZXhhbXBsZS5jb20ifQ.vzZIBWRSlMogYszFTj61Mn7XdjxeK16fZFnJtou3q1c",
  "expires": 1584976785890,
  "refresh_token": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywic3ViIjoicmVmcmVzaCIsImF1ZCI6InVzZXIiLCJleHAiOjE2MTE0MTUxODU4OTEsImlhdCI6MTU3OTc5Mjc4NTg5MSwianRpIjoiMjBiMGIwZGUtMWJlZC00ZGE4LWE1ZjEtY2QxZTgxZGZlNTQ1IiwiZW1haWwiOiJhZG1pQGV4YW1wbGUuY29tIn0.8Z7dTlHvglAW3iz1aCXz1Yffv4wfVrRMr3N5-tHX_bk",
    "expires": 1611415185891,
    "expires_in": 31622400
  },
  "user": {
    "id": 3,
    "name": null,
    "email": "admin@example.com"
  },
  "profile": {
    "id": 2,
    "time_zone": "America/Mexico_City",
    "locale": "es",
    "userId": 3,
    "createdAt": "2020-01-23T15:19:45.000Z",
    "updatedAt": "2020-01-23T15:19:45.000Z"
  }
}
```

#### ~ Log in

Already registered users can log in with a POST call to:

    /api/v1/auth/login

The body of the POST request should consist of the following JSON:

```json
{
  "email": "admin@example.com",
  "password": "adminadmin"
}
```

Thence shall you receive the following JSON response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic3ViIjoiYWNjZXNzIiwiYXVkIjoidXNlciIsImV4cCI6MTU4NDk3NzY5MjgxMywiaWF0IjoxNTc5NzkzNjkyODE0LCJqdGkiOiJhYzZmZmRlYy00YzZlLTRmZjMtYTZkMC1lMDhiMTc0YmI5OGYiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIn0.shbeImgizz_TEEMFe8J5cWBlkrqvY9o1YrZ2ChuSgZo",
  "expires": 1584977692813,
  "refresh_token": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic3ViIjoicmVmcmVzaCIsImF1ZCI6InVzZXIiLCJleHAiOjE2MTE0MTYwOTI4MTQsImlhdCI6MTU3OTc5MzY5MjgxNCwianRpIjoiODNmYTNkZGEtOTIzYS00ZDM2LThmODAtYzkzODg1YTNlNDU2IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSJ9.6uMJF_8Fxi55V8bcmTWgGdlBSAAklTwTT_BLtciKmGg",
    "expires": 1611416092814,
    "expires_in": 31622400
  },
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com"
  },
  "profile": {
    "id": 1,
    "time_zone": "America/Mexico_City",
    "locale": "es",
    "userId": 1,
    "createdAt": "2020-01-22T14:26:25.000Z",
    "updatedAt": "2020-01-22T14:26:25.000Z"
  }
}
```

#### ~ Update User

Once a user has been created, they can be updated via a PUT request to

    /api/v1/user/:id

Where `:id` is the id of the user you wish to alter. The request body should be structured like so:

```json
{
  "name": "joe"
}
```

And in your request, the following header:

    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic3ViIjoicmVmcmVzaCIsImF1ZCI6InVzZXIiLCJleHAiOjE2MTE0MTYwOTI4MTQsImlhdCI6MTU3OTc5MzY5MjgxNCwianRpIjoiODNmYTNkZGEtOTIzYS00ZDM2LThmODAtYzkzODg1YTNlNDU2IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSJ9.6uMJF_8Fxi55V8bcmTWgGdlBSAAklTwTT_BLtciKmGg

The token must belong to a user with an administrative role. After the token, you can include whatever attributes of the user you wish to update (name, email, role, etc).

The response will look like this:

```
{
    success: true
}
```

The `success` field will be true if the operation was successful. Otherwise you will receive a response saying `"No Token Present"`.

#### ~ Delete User

If you wish to remove a user from the system, they can be deleted via a DELETE request to

    /api/v1/user/:id

Where `:id` is the id of the user you wish to remove. The request body should be structured like so:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic3ViIjoiYWNjZXNzIiwiYXVkIjoidXNlciIsImV4cCI6MTU4NDk3NzY5MjgxMywiaWF0IjoxNTc5NzkzNjkyODE0LCJqdGkiOiJhYzZmZmRlYy00YzZlLTRmZjMtYTZkMC1lMDhiMTc0YmI5OGYiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIn0.shbeImgizz_TEEMFe8J5cWBlkrqvY9o1YrZ2ChuSgZo"
}
```

Only administrators can delete users. The response will look like this:

```
{
    success: true
}
```

The `success` field will be true if the operation was successful. Otherwise you will receive a response saying `"No Token Present"`.

# Documents

#### ~ Upload

Any user can upload a document. Therefore, a valid token from any existing user is sufficient authorization to create a document. To do so, you make a POST request to:

    /api/v1/document/:candidateId

Since we are uploading a file, it will have to be a multipart form request, like so in curl:

    curl -F 'img=@hello.txt' http://localhost/api/v1/document/:candidateId --header "Content-Type: application/json" --data '{"token":"eyJHSdD878s7d8s7dSd87ggdf"}' -X POST

Where `candidateId` is the ID of the candidate the document pertains to. To get an idea of how this looks in React, consult this guide: https://programmingwithmosh.com/javascript/react-file-upload-proper-server-side-nodejs-easy/

The response will be a JSON containing the document's path and id:

```json
{
  "path": "/:candidateId/filename.txt",
  "id": "9"
}
```

#### ~ Delete

In cases where a document needs to be reuploaded, or updated, it is preferable to upload a new version of the document and leave the previous version available. Therefore, only administrative users can delete a document. To do so, a DELETE request must be made to the following route:

    /api/v1/document/:id

The body of the request should consist of JSON containing a valid token:

```json
{
  "token": "eyJHSdD878s7d8s7dSd87ggdf"
}
```

If the operation is successful, you will receive a JSON consisting of a single `"success": true` property.

# Roles

Currently, there are multiple roles:

- admin - roleId: 1
- recruiter - roleId: 2
- interviewer - roleId: 3
- manager - roleId: 4

  Soon we will be adding an API for role creation by admins. In the meantime, you can raise an issue in the Gitlab repository if you wish to add an additional role. In the meantime, you can see what privileges are provided for a certain role by calling

  /api/v1/role/:id

No token is necessary to inquire about the privileges of a given role.

# Jobs

#### ~ View Jobs

View all current jobs by sending a GET request to

    /api/v1/job/view_all

#### ~ Create Job

Any user can create a job via a POST request to the route

    /api/v1/job/create

The body of the POST request should consist of the following JSON:

```json
{
  "token": "ey2sd89d8h98gdfdsdsd98kjsdkjnmakq",
  "title": "Security Trainee",
  "salary": "12000",
  "description": "Perfect position for ambitious, eager devs like Alex"
}
```

If the operation is successful the API will respond with the new job ID

```json
{
  "jobId": "892"
}
```

#### ~ Delete Job

Any user can delete a job by sending a DELETE request to

    /api/v1/user/:id

Where `:id` is the JobId. The response should be a simple success message:

```json
{
  "success": "true"
}
```

# Candidates

#### ~ View Candidate

All candidates can be view by sending a GET request to

    /api/v1/candidate/view_all

#### ~ Add Candidate

To create a candidate as any user, send a POST request to

    /api/v1/candidate/create

In the body of the POST request include the following JSON:

```json
{
  "name": "Ada Lovelace",
  "status": "hired",
  "token": "ey29817jsdmdb72b2b21o19a83",
  "phone": "8675309",
  "Github": "github.com/seisvelas"
}
```

As a response you will receive the Candidate ID.

#### ~ Update Candidate

To update a candidate with details such as the position they are applying to and who is recruiting them, make a PUT call to

    /api/v1/candidate/:id

In the request body JSON, include whatever details you wish to alter (in addition to your token) and the candidate ID:

```json
{
  "token": "e2djfdjf3i42jsjhsdjaebrvzzc",
  "id": 929,
  "name": "Madam Babbage",
  "deprecate_recruiter": [784],
  "new_recruiter": [991, 881],
  "positions": [232, 113, 100],
  "note": "Great person, give big bucks"
}
```

#### ~ Delete Candidate

To delete a candidate, just send a DELETE request with your token to

    /api/v1/candidate/:id

If the operation is successful you will receive a success message.

# Feedback

To add a feedback, make a POST request to

    /api/v1/feedback

With a JSON containing the rating and description

```json
{
  "candidateId": "610edfe5-4234-406a-89dd-ff5a78a39deb",
  "score": 4,
  "comment": "Candidate good, I like"
}
```

# Notes

To add a note, make a POST request to

    /api/v1/note

With a JSON containing the note and description

```json
{
  "candidateId": "610edfe5-4234-406a-89dd-ff5a78a39deb",
  "note": "Good candidate"
}
```

# Unprotected Candidate

An applicant (also called an unprotected candidate) will be able to apply to a job using the following endpoint

    /api/v1/candidate/apply

The format body should be form-data

Required values

```

```

| Key       | Value              |
| --------- | ------------------ |
| resume    | `aplicant.pdf`     |
| firstName | Sam                |
| lastName  | Evans              |
| phone     | 9138857787         |
| email     | email@example.com  |
| jobId     | d6fa15dfad44a9d1a6 |
| type      | application/pdf    |

```

```

Optional values

```

```

| Key             | Value                                              |
| --------------- | -------------------------------------------------- |
| website         | [https://simonsinek.com/](https://simonsinek.com/) |
| linkedinProfile | https://www.linkedin.com/in/irval                  |
| employer        | TCS                                                |

```

```

#### ~ Notifications

Notifications are created when a new candidate is created and when a note or feedback is giving to a candidate.

This notifications will last four days in the database, after running a janitor service every midnight.
