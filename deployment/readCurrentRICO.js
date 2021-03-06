const config = require('./rICO-config-deployment');
const utils = require("../test/solc_tests/helpers/utils.js");
const Web3 = require("web3");
const fs = require("fs");

makeBatchRequest = function(web3, calls, callFrom) {
    let batch = new web3.BatchRequest();
    let promises = calls.map(call => {
        return new Promise((resolve, reject) => {
            let request = call.request({from: callFrom}, (error, data) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
            batch.add(request);
        });
    });

    batch.execute();

    return Promise.all(promises);
};
let web3 = new Web3(config.settings.provider);


let run = async function() {
    const abi = await utils.getAbi("ReversibleICO");

    let rICOcontract = new web3.eth.Contract(abi, '0xE417b912F6cB6592ec2D71dbF6F2B48191b2CdF6', {gas: '6500000', gasPrice: '400000000'});

    let participantsId = await rICOcontract.methods.participantCount().call();
    console.log('participantsId', participantsId);


    let participantRequests = [];
    for(let i = 0; i <= participantsId; i++) {
        participantRequests.push(await rICOcontract.methods.participantsById(i).call);
    }
    let participantsAddresses = await makeBatchRequest(web3, participantRequests);

    participantRequests = [];
    participantsAddresses.forEach((partici) => {
        participantRequests.push(rICOcontract.methods.participants(partici).call);
    });
    let participants = await makeBatchRequest(web3, participantRequests);
    // let participants = require('../WHITELISTED_participants_2020-06-05T15-51:51-942Z.json');
    //
    //
    // // add lister
    // web3.eth.accounts.wallet.add('0x');
    // let acc = web3.eth.accounts.wallet[0].address;
    // let nonce = await web3.eth.getTransactionCount(acc);
    // console.log(acc, nonce);

    let list = [];
    participants.forEach((partici, i)=>{
        // partici.address = participantsAddresses[i];

        if(partici.whitelisted){
            list.push(partici.address);
        }

        if(partici.committedETH > 0) {
            // console.log('committedETH', partici.address);

            // list.push(partici.address);
        }
        if(partici.pendingETH > 0) {
            // console.log('pendingETH', partici.address);

            // list.push(partici.address);
        }

    });

    console.log(list.length);
    console.log(list);

    await rICOcontract.methods.whitelist(list, true).send({
        from: acc,
        gas: '1250000',
        gasPrice: '40000000000',
        // nonce: nonce++
    });


    // fs.writeFileSync('./participants_'+ new Date().toISOString().replace(':','-').replace('.','-') +'.json', JSON.stringify(participants, null, 4) ,{encoding:'utf8',flag:'w'});
};
run();
