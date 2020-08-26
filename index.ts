import {InstaAutoComment} from "./InstaAutoComment";
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
const commentsArray = process.env.COMMENTS_ARRAY.split(",").map((item) => item.trim());
const trackedUsersUsernames: string[] = process.env.TRACKED_USERS_USERNAMES.split(",").map((item) => item.trim());
let trackedUsersPks: number[];
let pushbulletNotificationEnabled: boolean = stringToBool(process.env.PUSHBULLET_NOTIFICATION);
let pushbulletAccessToken = process.env.PUSHBULLET_ACCESS_TOKEN;
let pusher;

if (pushbulletNotificationEnabled) {
    const PushBullet = require('pushbullet');
    pusher = new PushBullet(pushbulletAccessToken);
}

let iac = new InstaAutoComment();


(async () => {
    try {
        await iac.login().then(async r => {
            trackedUsersPks = await iac.usernamesToPks(trackedUsersUsernames);
            iac.trackedUsersUsernames = trackedUsersUsernames;
            console.log('\n');
            // you received a notification
            iac.ig.fbns.push$.subscribe(
                async (push) => {
                    if (push.pushCategory === "post" && trackedUsersPks.includes(Number(push.sourceUserId))) {
                        await iac.ig.media.like({d: 1, mediaId: push.actionParams["id"], moduleInfo: {module_name: 'feed_timeline'}})
                        await iac.commentOnPostWithRandomComment(push.actionParams["id"], commentsArray);
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
            iac.ig.fbns.error$.subscribe((fbnsError) => {
                iac.logEvent('error', fbnsError);
                if (pushbulletAccessToken) pusher.note('', 'InstaAutoComment | Error with MQTT client', fbnsError.message);
            });

            // 'warning' is emitted whenever the client errors but the connection isn't affected
            iac.ig.fbns.warning$.subscribe((fbnsWarning) => {
                iac.logEvent('warning', fbnsWarning);
            });

            // this sends the connect packet to the server and starts the connection
            // the promise will resolve once the client is fully connected (once /push/register/ is received)
            await iac.ig.fbns.connect();

            trackedUsersUsernames.forEach(trackedUsersUsername => {
                console.log(chalk.blue("Tracking: ", trackedUsersUsername));
            });

            const spinner = ora('Waiting for a notification').start();
        });
    } catch (e) {
        console.log(e);
        if (pushbulletAccessToken) pusher.note('', 'InstaAutoComment | Error with program', e.message);
    }
})();

function stringToBool(stringBool: string) {
    if (stringBool.toLowerCase() === "true") {
        return true;
    } else if (stringBool.toLowerCase() === "false") {
        return false;
    } else {
        return false;
    }
}
