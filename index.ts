import {InstaAutoComment} from "./InstaAutoComment";
import * as util from "util";

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
let iac = new InstaAutoComment(34084408297);
util.inspect.defaultOptions.maxArrayLength = null;


(async () => {
    iac.login().then(async r => {
        // iac.accountFollowing(34084408297);
        // iac.accountMediaFeed(2153673617);
        await iac.selectUserItemsWithTimeRestriction(-1);
        await iac.printIdsToCommentOn();

        // iac.postRandomCommentsOnSelectedItems(InstaAutoComment.commentArrayTest, 1000);
        // iac.haveCommented("2289673074177870289_34084408297");
        // console.log(instagramIdToUrlSegment(iac.feedItemIdTtoMediaId("2282271774947131603_2153673617")));
    })
})();
