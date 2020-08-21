import {
    AccountRepositoryLoginResponseLogged_in_user, MediaRepositoryCommentResponseComment,
    StatusResponse,
    UserFeedResponseItemsItem
} from "instagram-private-api/dist/responses";
import {IgApiClient} from 'instagram-private-api/dist/core/client';
import {IgLoginTwoFactorRequiredError} from 'instagram-private-api/dist/errors/ig-login-two-factor-required.error';
import {AccountRepository} from "instagram-private-api/dist/repositories/account.repository";
// import {inquirer} from "inquirer";
import {IgActionSpamError, IgResponseError, UserFeed} from "instagram-private-api";
const chalk = require('chalk');
import { promisify } from 'util';
import { writeFile, readFile, exists } from 'fs';
let ref, urlSegmentToInstagramId, instagramIdToUrlSegment;
ref = require('instagram-id-to-url-segment');
instagramIdToUrlSegment = ref.instagramIdToUrlSegment;
urlSegmentToInstagramId = ref.urlSegmentToInstagramId;
import { FbnsClient, IgApiClientExt, IgApiClientFbns, withFbns } from 'instagram_mqtt';
import inquirer = require('inquirer');
require('instagram-id-to-url-segment');
require('dotenv').config();

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);
const existsAsync = promisify(exists);

let igUser = process.env.IG_USERNAME;
let igPass = process.env.IG_PASSWORD;
const trackedUsersUsernames: string[] = process.env.TRACKED_USERS_USERNAMES.split(",").map((item)=>item.trim());


export class InstaAutoComment {
    public static commentArrayTest = ["test1", "test2", "test3", "test4"];
    public static commentArrayStupid = ["Cute", "❤❤❤❤", "😍😍😍😍", "😘😘😘😘", "🧡🧡🧡🧡", "💛💛💛💛", "💚💚💚💚"];
    public auth: AccountRepositoryLoginResponseLogged_in_user;
    public ig: IgApiClientFbns;
    public account: AccountRepository;
    public idsToCommentOn = [];
    private throttleSeconds = 1000;
    public trackedUsersPks: number[];
    public trackedUsersUsernames: string[];

    constructor() {
        this.ig = withFbns(new IgApiClient());
        this.ig.state.proxyUrl = process.env.IG_PROXY;
        this.trackedUsersPks = [];
        this.trackedUsersUsernames = [];
    }

    public async login(): Promise<AccountRepositoryLoginResponseLogged_in_user> {
        await this.readState(this.ig);
        return new Promise(async (resolve, reject) => {
            if (!igUser) {
                await inquirer.prompt([
                    {
                        type: 'text',
                        name: 'igUser',
                        message: 'Username',
                    }
                ]).then(r => {
                    igUser = r.igUser;
                });
            }
            this.ig.state.generateDevice(igUser);
            if (!igPass) {
                console.log("Username: " + igUser);
                await inquirer.prompt([
                    {
                        type: 'password',
                        name: 'igPass',
                        message: 'Password',
                    }
                ]).then(r => {
                    igPass = r.igPass;
                });
            }
            this.ig.request.end$.subscribe(() => this.saveState(this.ig));
            this.ig.account.login(igUser, igPass).then(async (result) => {
                console.log("Logged in as: ", result.username);
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
                    }).then(async (result) => {
                        console.log("Logged in as: ", result.username);
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
    public feedItemIdToMediaId(feedItemId: string): string {
        return feedItemId.substring(0, feedItemId.indexOf("_"));
    }

    //converts the id of a feed item to a media id
    public feedItemIdToInstagramUrl(string: string): string {
        let res = string.substring(0, string.indexOf("_"));
        return instagramIdToUrlSegment(res);
    }

    public getUserPk(username: string): Promise<number> {
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
    public printIdsToCommentOn(): void {
        console.log("Posts to comment on:");
        this.idsToCommentOn.forEach(elm => {
            console.log("https://www.instagram.com/p/" + instagramIdToUrlSegment(this.feedItemIdToMediaId(elm)));
        });
        console.log("idsToCommentOn length: " + this.idsToCommentOn.length);
    }

    // public async asyncHaveCommented(id: string) {
    //     return this.haveCommented(id);
    // }

    /**
     *
     * @param userFeedItem a feed item id of a media/post
     */
    public async haveCommented(userFeedItem: UserFeedResponseItemsItem) {
        let waitSeconds = 3000;
        let feedItemId = userFeedItem.id;
        let mediaCommentsFeed = this.ig.feed.mediaComments(feedItemId);
        let currentUser = await this.ig.account.currentUser();
        // console.log("SETTING TIMEOUT PROMISE FOR: " + (waitSeconds) + " SECONDS", new Date().toLocaleTimeString());
        await new Promise(r => setTimeout(r, this.throttleSeconds));
        let subscription;
        let res = false;
        let feedItems;
        do {
            feedItems = await mediaCommentsFeed.items();
            // console.log("SETTING TIMEOUT PROMISE FOR: " + (waitSeconds) + " SECONDS", new Date().toLocaleTimeString());
            await new Promise(r => setTimeout(r, this.throttleSeconds));
            if (feedItems !== undefined) {
                for (let feedItem of feedItems) {
                    if (feedItem.user_id === currentUser.pk) {
                        res = true;
                    }
                }
            }
            if (res) {
                // console.log("comment exists on: " + "https://www.instagram.com/p/" + this.feedItemIdToInstagramUrl(feedItemId));
                break;
            }
        } while (mediaCommentsFeed.isMoreAvailable());
        return res;
    }

    public async postRandomCommentsOnSelectedItems(commentsArray: string[], delayBetweenComments = 3000) {
        if (this.idsToCommentOn.length > 0) {
            let mediaRepo = this.ig.media;
            let comment = {mediaId: undefined, text: undefined};
            console.log("going to comment on " + this.idsToCommentOn.length + " comments(s)");
            let commentResult;

            for (let idToCommentOn of this.idsToCommentOn) {
                comment.mediaId = idToCommentOn;
                comment.text = InstaAutoComment.choseRandomComment(commentsArray);
                try {
                    commentResult = await mediaRepo.comment(comment);
                    console.log(chalk.green("Commented on " + "https://www.instagram.com/p/" + instagramIdToUrlSegment(commentResult.media_id) + " with the comment " + commentResult.text));
                    // console.log("SETTING TIMEOUT PROMISE FOR: " + (delayBetweenComments) + " SECONDS", new Date().toLocaleTimeString());
                    await new Promise(r => setTimeout(r, delayBetweenComments));
                } catch (err) {
                    if (err instanceof IgActionSpamError) {
                        console.log("IgActionSpamError");
                    } else if (err instanceof IgResponseError) {
                        console.log("IgResponseError on: ", "https://www.instagram.com/p/" + instagramIdToUrlSegment(idToCommentOn));
                        console.log(err);
                        console.log('err.message: ', err.message);
                        console.log('err.response: ', err.response);
                        console.log('err.text: ', err.text);
                        console.log('err.name: ', err.name);
                        console.log('err.stack: ', err.stack);
                    } else {
                        console.log("error while commenting:");
                        console.log(err);
                    }
                }
            }
        } else {
            console.log("nothing to comment on");
        }
        this.idsToCommentOn = [];
    }

    public commentOnPostWithRandomComment = async (mediaId: string, commentsArray: string[]): Promise<void> => {
        let mediaRepo = this.ig.media;
        let comment = {mediaId: undefined, text: undefined};
        let commentResult: MediaRepositoryCommentResponseComment;
        comment.mediaId = mediaId;
        comment.text = InstaAutoComment.choseRandomComment(commentsArray);

        try {
            commentResult = await mediaRepo.comment(comment);
            console.log('\n');
            console.log(chalk.green("Commented on " + "https://www.instagram.com/p/" + instagramIdToUrlSegment(commentResult.media_id) + " with the comment " + commentResult.text));
        } catch (err) {
            if (err instanceof IgActionSpamError) {
                console.log("IgActionSpamError");
            } else if (err instanceof IgResponseError) {
                console.log(chalk.red("IgResponseError on: ", "https://www.instagram.com/p/" + instagramIdToUrlSegment(mediaId)));
                console.log(err);
                console.log('err.message: ', err.message);
                console.log('err.response: ', err.response);
                console.log('err.text: ', err.text);
                console.log('err.name: ', err.name);
                console.log('err.stack: ', err.stack);
            } else {
                console.log("error while commenting:");
                console.log(err);
            }
        }
    };

    private static choseRandomComment(array: string[]): string {
        return array[Math.floor(Math.random() * array.length)]
    }

    public async accountFollowing(id: number) {
        console.log("Getting following...");
        const followingFeed = this.ig.feed.accountFollowing(id);
        // console.log("followingFeed.request()");
        // return followingFeed.request();

        console.log("Following:");
        let first = followingFeed.toPlain();
    }

    public async accountMediaFeed(id: number) {
        const userFeed = this.ig.feed.user(id);

        let allItems = [];
        do {
            let items = await userFeed.items();
            allItems = allItems.concat(items);
        } while (userFeed.isMoreAvailable());

        console.log("total posts: " + allItems.length.toString());
    }

    public async saveState(ig: IgApiClientExt) {
        return writeFileAsync('state.json', await ig.exportState(), { encoding: 'utf8' });
    }

    public async readState(ig: IgApiClientExt) {
        if (!await existsAsync('state.json'))
            return;
        await ig.importState(await readFileAsync('state.json', {encoding: 'utf8'}));
    }

    /**
     * A wrapper function to log to the console
     * @param name
     * @param data
     * @returns void
     */
    public logEvent(name: string, data?) {
        console.log(chalk.blue(name), chalk.blue(data));
    }

    public async usernamesToPks(usernames: string[]){
        for (let username of usernames) {
            this.trackedUsersPks.push(await this.ig.user.getIdByUsername(username));
        }
        return this.trackedUsersPks;
    };

    public async pksToUsernames(pks: number[]) {
        for (let pk of pks) {
            let userInfo = await this.ig.user.info(pk);
            this.trackedUsersUsernames.push(userInfo.username);
        }
    }
}

export enum DoComment {
    IfThereIsNoComment,
    EvenIfThereIsAComment
}

function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}
