# InstaAutoComment
Automatically places a comment on specific users' new Instagram post.
# Why was this made?
I was done with my sister always asking me to like and comment on het Instagram account so I made this.
# Usage
## Requirements:
- Node.js
- Typescript
- git (optional)
## Installation:
- Download the files from the latest release or git
- `npm install`
## Configuration:
- Compile the typescipt files by running `tsc index.ts` in your terminal
- Make a copy of the file [.env.example](.env.example) and name it ".env", fill the next fields inside the file:
  - IG_USERNAME (optional): the username of the user you want to login with, if this is left empty you will get asked to provide it when running the program.
  - IG_PASSWORD (optional): the password of the user you want to login with, if this is left empty you will get asked to provide it when running the program.
  - TRACKED_USERS_USERNAMES: the username of the user you want to track and comment on their posts.
  - COMMENTS_ARRAY: a comma delimmeted string with the comments options the program is going to choose from while commenting on a post.
  - PUSHBULLET_NOTIFICATION: true or false. Whether you want to receive a notification via pushbullet when this program comments on someone's post. (You need a pushbullet access token)
  - PUSHBULLET_ACCESS_TOKEN (required if PUSHBULLET_NOTIFICATION is true otherwise optional): A pushbullet access token needed to use pushbullet notifications.
- You need to turn on post notification on the users you have specified in TRACKED_USERS_USERNAMES from your phone for this program to work.
## Running:
`node index.js`
If the IG_USERNAME or IG_PASSWORD are missing the program will ask you to fill them.
# Uses [instagram-private-api](https://github.com/dilame/instagram-private-api) and [instagram_mqtt](https://github.com/Nerixyz/instagram_mqtt)
Thanks to all the contributers of these repositories
