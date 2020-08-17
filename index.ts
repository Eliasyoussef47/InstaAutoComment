import {InstaAutoComment} from "./InstaAutoComment";
import * as util from "util";
require('dotenv').config();

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

//Betty feed item id  2282271774947131603_2153673617
//SyrianShady feed item id 2289673074177870289_34084408297
util.inspect.defaultOptions.maxArrayLength = null;
const loopInterval: number = +process.env.LOOP_INTERVAL;
const trackingUserPk: number = +process.env.TRACKING_USER_PK;
const postSecondsOld: number = +process.env.POST_SECONDS_OLD;
const commentsArray = process.env.COMMENTS_ARRAY.split(",").map((item)=>item.trim());

let iac = new InstaAutoComment(trackingUserPk);


(async () => {
    iac.login().then(async r => {
        let intervalFunc = async () => {
            await iac.selectUserItemsWithTimeRestriction(postSecondsOld);
            // await iac.printIdsToCommentOn();
            await iac.postRandomCommentsOnSelectedItems(commentsArray, 3000);
        };
        await intervalFunc();
        let interval = setInterval(intervalFunc, loopInterval);
    })
})();
