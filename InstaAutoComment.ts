import {AccountRepositoryLoginResponseLogged_in_user, StatusResponse} from "instagram-private-api/dist/responses";
import {IgApiClient} from 'instagram-private-api/dist/core/client';
import {IgLoginTwoFactorRequiredError} from 'instagram-private-api/dist/errors/ig-login-two-factor-required.error';
import {AccountRepository} from "instagram-private-api/dist/repositories/account.repository";
import inquirer from "inquirer";
import {IgActionSpamError, IgResponseError} from "instagram-private-api";

let ref, urlSegmentToInstagramId, instagramIdToUrlSegment;
ref = require('instagram-id-to-url-segment');
instagramIdToUrlSegment = ref.instagramIdToUrlSegment;
urlSegmentToInstagramId = ref.urlSegmentToInstagramId;

require('instagram-id-to-url-segment');
require('dotenv').config();

export class InstaAutoComment {
    public static commentArrayTest = ["test1", "test2", "test3", "test4"];
    public static commentArrayStupid = ["Cute", "❤❤❤❤", "😍😍😍😍", "😘😘😘😘", "🧡🧡🧡🧡", "💛💛💛💛", "💚💚💚💚"];
    public auth: AccountRepositoryLoginResponseLogged_in_user;
    public ig: IgApiClient;
    public account: AccountRepository;
    public idsToCommentOn = [];
    public pk: number;

    constructor(pk: number) {
        this.ig = new IgApiClient();
        this.ig.state.generateDevice(process.env.IG_USERNAME);
        this.ig.state.proxyUrl = process.env.IG_PROXY;
        this.pk = pk;
    }

    public login(): Promise<AccountRepositoryLoginResponseLogged_in_user> {
        console.log("Attempting login");
        return new Promise((resolve, reject) => {
            this.ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD).then((result) => {
                console.log("Logged in!");
                this.auth = result;
                this.account = this.ig.account;
                resolve(result);
            }).catch(async (e) => {
                if (e instanceof IgLoginTwoFactorRequiredError) {//if user has TFA enabled
                    console.log("User has Two Factor Authentication enabled.");
                    const {username, totp_two_factor_on, two_factor_identifier} = e.response.body.two_factor_info;
                    // decide which method to use
                    const verificationMethod = totp_two_factor_on ? '0' : '1'; // default to 1 for SMS
                    // At this point a code should have been sent
                    // Get the code
                    const {code} = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'code',
                            message: `Enter code received via ${verificationMethod === '1' ? 'SMS' : 'TOTP'}`,
                        },
                    ]);
                    // Use the code to finish the login process
                    this.ig.account.twoFactorLogin({
                        username,
                        verificationCode: code,
                        twoFactorIdentifier: two_factor_identifier,
                        verificationMethod, // '1' = SMS (default), '0' = TOTP (google auth for example)
                        trustThisDevice: '1', // Can be omitted as '1' is used by default
                    }).then((result) => {
                        console.log("Logged in!");
                        this.auth = result;
                        this.account = this.ig.account;
                        resolve(result);
                    });
                } else {
                    reject(e);
                }
            });
        });
    }

    public logout(): Promise<StatusResponse> {
        console.log("attempting logout");
        return this.ig.account.logout();
    }

    //converts the id of a feed item to a media id
    public feedItemIdTtoMediaId(string: string) {
        return string.substring(0, string.indexOf("_"));
    }

    /**
     *
     * @param id
     */
    private getUserFeed(id: string | number = this.pk) {
        return this.ig.feed.user(id);
    }

    /**
     * gets id's of the user's posts that were uploaded within "secondsOld" ago (ex: posts that were uploaded 3 hours ago)
     * @param userFeed
     * @param secondsOld
     */
    public selectUserItemsWithTimeRestriction(secondsOld: number = 3600): Promise<void> {
        return new Promise((resolve, reject) => {
            let nowTimestamp = Math.floor(Date.now() / 1000);
            let subscription;
            console.log("Selecting appropriate items");
            let userFeed = this.getUserFeed();
            subscription = userFeed.items$.subscribe(
                items => {
                    let res = items.every(element => {
                        if ((nowTimestamp - element.taken_at) <= secondsOld) {
                            this.idsToCommentOn.push(element.id);
                            return true;
                        } else {
                            return false;
                        }
                    });
                    if (!res) {
                        subscription.complete();
                    }
                },
                error => {
                    console.error(error);
                    reject(error);
                },
                () => {
                    subscription.unsubscribe();
                    resolve();
                },
            );
        });
    }

    public getUserPk(username: string) {
        return this.ig.user.searchExact(username).then(r => {
            return new Promise((resolve, reject) => {
                resolve(r.pk);
            });
        });
    }

    public getUserInfo(id: number) {
        this.ig.user.info(id).then(r => {
            return new Promise((resolve, reject) => {
                resolve(r);
            });
        });
    }

    /**
     * converts the id's (that are the target for the comments) as url's to the posts
     */
    public printIdsToCommentOn() {
        console.log("Posts to comment on:");
        this.idsToCommentOn.forEach(elm => {
            console.log("https://www.instagram.com/p/" + instagramIdToUrlSegment(this.feedItemIdTtoMediaId(elm)));
        });
        console.log("idsToCommentOn length: " + this.idsToCommentOn.length);
    }

    public postCommentsOnSelectedItems(commentsArray: string[], delayBetweenComments = 3000) {
        console.log("postComments started");
        if (this.idsToCommentOn.length > 0) {
            let mediaRepo = this.ig.media;
            let comment = {mediaId: undefined, text: undefined};
            console.log("going to comment on " + this.idsToCommentOn.length + " comments(s)");

            this.idsToCommentOn.forEach((elm, i) => {
                setTimeout(() => {
                    comment.mediaId = this.idsToCommentOn[i];
                    comment.text = InstaAutoComment.choseRandomComment(commentsArray);
                    mediaRepo.comment(comment).then(r => {
                        console.log("Commented on " + "https://www.instagram.com/p/" + instagramIdToUrlSegment(r.media_id) + " with the comment " + r.text);
                    }).catch(err => {
                        if (err instanceof IgActionSpamError) {
                            console.log("IgActionSpamError");
                        } else if (err instanceof IgResponseError) {
                            console.log("IgResponseError");
                        } else {
                            console.log("error while commenting:");
                            console.log(err);
                        }
                    });
                }, i * delayBetweenComments);
            });
        } else {
            console.log("nothing to comment on");
        }
    }

    private static choseRandomComment(array: string[]) {
        return array[Math.floor(Math.random() * array.length)]
    }
}