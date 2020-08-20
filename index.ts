import {InstaAutoComment} from "./InstaAutoComment";
import {DoComment} from "./InstaAutoComment";
import * as util from "util";
require('dotenv').config();
const chalk = require('chalk');
const ora = require('ora');
let ref, urlSegmentToInstagramId, instagramIdToUrlSegment;
ref = require('instagram-id-to-url-segment');
instagramIdToUrlSegment = ref.instagramIdToUrlSegment;
urlSegmentToInstagramId = ref.urlSegmentToInstagramId;

//Betty pk 2153673617
//Elias pk 321269674
//SyrianShady pk 34084408297
//logic pk 10532976
//loren pk 240759746
//
//

//Betty feed item id  2282271774947131603_2153673617
//SyrianShady feed item id 2289673074177870289_34084408297
util.inspect.defaultOptions.maxArrayLength = null;
const loopInterval: number = +process.env.LOOP_INTERVAL;
const trackingUserPk: number = +process.env.TRACKING_USER_PK;
const postSecondsOld: number = +process.env.POST_SECONDS_OLD;
const commentsArray = process.env.COMMENTS_ARRAY.split(",").map((item)=>item.trim());
const trackedUsersUsernames: string[] = process.env.TRACKED_USERS_USERNAMES.split(",").map((item)=>item.trim());
let trackedUsersPks: number[];

let iac = new InstaAutoComment();


(async () => {
    await iac.login().then(async r => {
        trackedUsersPks = await iac.usernamesToPks(trackedUsersUsernames);
        iac.trackedUsersUsernames = trackedUsersUsernames;
        trackedUsersUsernames.forEach(trackedUsersUsername => {
            console.log(chalk.blue("Tracking: ", trackedUsersUsername));
        });
        console.log('\n');
        // you received a notification
        iac.ig.fbns.push$.subscribe(
            (push) => {
                if (push.pushCategory === "post" && trackedUsersPks.includes(Number(push.sourceUserId))) {
                    iac.commentOnPostWithRandomComment(push.actionParams["id"], commentsArray);
                }
            }
        );

        // the client received auth data
        // the listener has to be added before connecting
        iac.ig.fbns.auth$.subscribe(async (auth) => {
            // logs the auth
            // iac.logEvent('auth')(auth);
            //saves the auth
            await iac.saveState(iac.ig);
        });

        // 'error' is emitted whenever the client experiences a fatal error
        iac.ig.fbns.error$.subscribe(iac.logEvent('error'));

        // 'warning' is emitted whenever the client errors but the connection isn't affected
        iac.ig.fbns.warning$.subscribe(iac.logEvent('warning'));

        // this sends the connect packet to the server and starts the connection
        // the promise will resolve once the client is fully connected (once /push/register/ is received)
        await iac.ig.fbns.connect();

        const spinner = ora('Waiting for notification').start();
    });
})();
