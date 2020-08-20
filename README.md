# InstaAutoComment
Automatically places a comment on a user's new Instagram post.

# Usage
## Requirements:
- Node.js
- Typescript
- git (optional)
## Installation:
- Download the files from the latest release
- `npm install`
## Configuration:
- Compile the typescipt files with `tsc index.ts` in your terminal
- Make a copy of the file [.env.example](.env.example) and name it .env, fill the next fields inside the file:
  - IG_USERNAME (optional): the username of the user you want to login with, if this is left empty you will get asked to provide it when running the program.
  - IG_PASSWORD (optional): the password of the user you want to login with, if this is left empty you will get asked to provide it when running the program.
  - TRACKING_USER_PK: th pk (instagram user ID) of the user you want to track and comment on their posts.
  - COMMENTS_ARRAY: a comma delimmeted string with the comments options the program is going to chose from while commenting on a post
## Running:
`node index.js`
If the IG_USERNAME or IG_PASSWORD are missing the program will ask you to fill them.
# Uses [instagram-private-api](https://github.com/dilame/instagram-private-api) and [instagram_mqtt](https://github.com/Nerixyz/instagram_mqtt)
Thanks to all the contributers of these repositories
