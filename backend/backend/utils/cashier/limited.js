const validator = require('validator');
const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');

const cashierCheckSendLimitedEnableRoblox = (user) => {
    if(user.roblox === undefined) {
        throw new Error('You need to link your roblox account.');
    }
}

const cashierCheckSendLimitedGenerateType = (twoStepType) => {
    if(twoStepType === null) {
        throw new Error('You need to change your 2fa method to emails or the authenticator app.');
    }
}

const cashierCheckSendLimitedVerifyData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.challengeId === undefined || typeof data.challengeId !== 'string' || data.challengeId.length > 36) {
        throw new Error('Your provided two challenge id is invalid.');
    } else if(data.twoStepCode === undefined || typeof data.twoStepCode !== 'string' || validator.isAlphanumeric(data.twoStepCode) !== true) {
        throw new Error('Your provided two step code is invalid.');
    }
}

const cashierCheckSendLimitedVerifyRoblox = (user) => {
    if(user.roblox === undefined) {
        throw new Error('You need to link your roblox account.');
    }
}

const cashierCheckSendLimitedDepositData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.items === undefined || Array.isArray(data.items) !== true || data.items.length <= 0 || data.items.length > 4) {
        throw new Error('Your provided items are invalid.');
    }
}

const cashierCheckSendLimitedDepositRoblox = (user) => {
    if(user.roblox === undefined) {
        throw new Error('You need to link your roblox account.');
    }
}

const cashierCheckSendLimitedDepositItems = (data, itemDatabase, transactionsDatabase) => {
    let checked = [];

    for(const item of data.items) {
        if(item === null || item.uniqueId === undefined || checked.includes(item.uniqueId) === true || itemDatabase.some((element) => element.uniqueId === item.uniqueId) !== true) {
            throw new Error('Your provided items are invalid.');
        } else if(transactionsDatabase.some((trade) => trade.deposit.items.some((element) => element.uniqueId === item.uniqueId) === true) === true) {
            throw new Error('Your provided items are already used in a different transaction.');
        }

        checked.push(item.uniqueId);
    }
}

const cashierCheckSendLimitedDepositUser = (user, transactionsDatabase, transactionsCanceledDatabase, canTradeRoblox) => {
    if(user.verifiedAt === undefined || new Date().getTime() > new Date(user.verifiedAt).getTime() + (1000 * 60 * 30)) {
        throw new Error('You reached your two step verification thresholds.');
    } else if(transactionsDatabase.length >= 12) {
        throw new Error('You can only have 12 active limited listings per time.');
    } else if(transactionsCanceledDatabase >= 8) {
        throw new Error('You got to many canceled limited listings in the last hour.');
    } else if(canTradeRoblox.canTrade !== true && canTradeRoblox.status === 'SenderCannotTrade') {
        throw new Error('You aren\'t able to trade. Please check your roblox account.');
    }
}

const cashierCheckSendLimitedWithdrawData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.transactionId === undefined || typeof data.transactionId !== 'string' || validator.isMongoId(data.transactionId) !== true) {
        throw new Error('Your provided transaction id is invalid.');
    }
}

const cashierCheckSendLimitedWithdrawRoblox = (user) => {
    if(user.roblox === undefined) {
        throw new Error('You need to link your roblox account.');
    }
}

const cashierCheckSendLimitedWithdrawTransaction = (user, transactionDatabase, cashierLimitedBlockTransaction) => {
    if(transactionDatabase === null || transactionDatabase.state !== 'created' || cashierLimitedBlockTransaction.includes(transactionDatabase._id.toString()) === true) {
        throw new Error('Your provided limited listing id is not available.');
    } else if(user._id.toString() === transactionDatabase.deposit.user._id.toString()) {
        throw new Error('You aren\'t allowed withdraw your own limited listing.');
    }
}

const cashierCheckSendLimitedWithdrawUser = (user, amountTransaction, canTradeRoblox) => {
    if(user.balance < amountTransaction) {
        throw new Error('You don’t have enough balance for this action.');
    } else if(user.verifiedAt === undefined || new Date().getTime() > new Date(user.verifiedAt).getTime() + (1000 * 60 * 30)) {
        throw new Error('You reached your two step verification thresholds. Please verify again.');
    } else if(canTradeRoblox.canTrade !== true && canTradeRoblox.status === 'SenderCannotTrade') {
        throw new Error('You aren\'t able to trade. Please check your roblox account.');
    } else if(user.limits.betToWithdraw >= 10) {
        throw new Error(`You need to wager ${parseFloat(Math.floor(user.limits.betToWithdraw / 10) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} more before you can withdraw.`);
    } else if(user.limits.blockSponsor === true) {
        throw new Error('You aren\'t allowed to withdraw at the moment.');
    }
}

const cashierLimitedGetDummyItem = (items, transactionsDatabase) => {
    let dummy = null;

    for(const item of items.sort((a, b) => a.price - b.price)) {
        if(
            item.amount <= (process.env.LIMITED_MAX_AMOUNT_DUMMY * 1000) &&
            transactionsDatabase.some((transaction) => transaction.deposit.items.some((element) => element.uniqueId === item.uniqueId) === true) === false
        ) {
            dummy = item;
        }
    }

    if(dummy !== null) { 
        return dummy; 
    } else { throw new Error('You dont have a valid dummy item in your inventory.'); }
}

const cashierLimitedGetInventory = async(proxy, robloxId) => {
    return new Promise(async(resolve, reject) => {
        try {
            // Create new proxy agent
            const proxyAgent = new HttpsProxyAgent(proxy);

            // Send get limited items request
            let response = await fetch(`https://inventory.roblox.com/v1/users/${robloxId}/assets/collectibles`, {
                agent: proxyAgent
            });

            // Check if the response is successful
            if(response.ok) {
                response = await response.json();
                resolve(response.data);
            } else {
                reject(new Error(response.statusText));
            }
        } catch(err) {
            reject(err);
        }
    });
}

const cashierLimitedGetItems = () => {
    return new Promise(async(resolve, reject) => {
        try {
            // Send get limited items request
            let response = await fetch('https://www.rolimons.com/itemapi/itemdetails');

            // Check if the response is successful
            if(response.ok) {
                response = await response.json();
                resolve(response.items);
            } else {
                reject(new Error(response.statusText));
            }
        } catch(err) {
            reject(err);
        }
    });
}

const cashierLimitedGetItemImages = async(itemIds) => {
    const maxRetries = 5; // Maximum number of retries
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms)); // Delay function

    return new Promise(async(resolve, reject) => {
        try {
            let limitedImages = [];

            for(let i = 0; i <= Math.floor(itemIds.length / 100); i++) {
                let attempts = 0;

                while (attempts <= maxRetries) {
                    try {
                        let response = await fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${itemIds.slice(i * 100, (i + 1) * 100).join(',')}&size=110x110&format=png`);

                        if(response.ok) {
                            response = await response.json();
                            limitedImages = [...limitedImages, ...response.data];
                            break; // If request is successful, exit the retry loop
                        } else {
                            throw new Error(response.statusText);
                        }
                    } catch (err) {
                        attempts++;
                        if (attempts > maxRetries) {
                            reject(new Error(`Failed after ${maxRetries} attempts: ${err.message}`));
                        } else {
                            await delay(1000 * Math.pow(2, attempts)); // Exponential backoff
                        }
                    }
                }

                await delay(1000); // Additional delay to space out requests
            }

            resolve(limitedImages);
        } catch (err) {
            reject(err);
        }
    });
}

const cashierGetUserCanTrade = (proxy, robloxCookie, userId) => {
    return new Promise(async(resolve, reject) => {
        try {
            // Create new proxy agent
            const proxyAgent = new HttpsProxyAgent(proxy);

            // Create header object
            let headers = {
               
