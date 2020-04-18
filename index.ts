
import { InstaAutoComment } from "./InstaAutoComment";

//Betty pk 2153673617
//Elias pk 321269674
//SyrianShady pk 34084408297

let iac = new InstaAutoComment(34084408297);

iac.login().then(r => {
    iac.selectUserItemsWithTimeRestriction(10800).then(() => {
        //iac.printIdsToCommentOn();
        iac.postCommentsOnSelectedItems(InstaAutoComment.commentArrayTest, 1000);
    })
});