const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

// 残高取得
// url            : /wallet
// hosting-url    : /v1/wallet
// method         : GET
// request-param  : address
// responce       : {"balance": "残高"}
// responce-state : 200 -> success , 500 -> system-error
//
exports.wallet = functions.https.onRequest((request, response) => {
 if (request.method === "GET"){
    const address = request.query.address;
    admin.database().ref("/wallets/"+address+"/balance").once("value").then(snapshot => {
        if(!snapshot.exists()){
            return response.status(200).json({"balance": 0}).end();
        }else{
            return response.status(200).json({"balance": snapshot.val()}).end();
        }
    }).catch(error => {
        console.log("reference error", error);
        return response.status(500).end();
    }); 

 } else{
    response.status(404).end();
 }
});

// 取引履歴
// url            : /transaction
// hosting-url    : /v1/transactions
// method         : GET
// request-param  : address
// responce       : json(transaction-entity)
// responce-state : 200 -> success , 500 -> system-error
//
exports.transaction = functions.https.onRequest((request, response) => {
 if (request.method === "GET"){
    const address = request.query.address;
    admin.database().ref("/wallets/"+address+"/transactions").once("value").then(snapshot => {
        const transfers = snapshot.val();
        const array = Object.keys(transfers).map(key => transfers[key]);
        console.log("reference success", array);
        return response.status(200).json(array).end();
    }).catch(error => {
        console.log("reference error", error);
        return response.status(500).end();
    }); 

 } else{
    response.status(404).end();
 }
});

// 送金API
// url            : /transfer
// hosting-url    : /v1/transfer
// method         : POST
// request-param  : address
// content-type   : applicatoin/json
// request-body   :{"toAddress": "送金先アドレス" , "amount": "取引額 , "billNo": "請求no"}
// responce-state : 200 -> success , 406-> 残高不足 , 500 -> system-error
//
exports.transfer = functions.https.onRequest((request, response) => {
 if(request.method === "POST") {
  const body = request.body;
  const address = request.query.address;
  const amount = body["amount"];
  const targetAddress = body["toAddress"];

    admin.database().ref("/wallets/"+address+"/balance").once("value").then(snapshot => {
        // 自身の情報更新
        const beforebalance = snapshot.val();
        if(snapshot.exists()){
            const afterbalance = parseInt(beforebalance) - parseInt(amount);
            console.log("balance exists", beforebalance, afterbalance);
            if(0 > afterbalance){
                return response.status(406).send("残高不足").end();
            }
            // 本当はonlineで更新しない(triggerか別バッチとか)
            admin.database().ref("/wallets/"+address+"/balance").set(afterbalance);
        }else{
            console.log("balance not exists", address);
            return response.status(406).send("残高なし").end();
        }

        admin.database().ref("/wallets/"+address+"/transactions").push().set({
            targetAddress: body["toAddress"]
            ,amount: body["amount"]
            ,billNo: body["billNo"]
            ,timestamp: new Date().toLocaleString()
            ,transactionType: "送金"
            ,status : "02"
        });

        // 対抗のアドレス情報更新（本当はtriggerとかでやりたかったが、sparkだと使えなさそうなので・・・）
        return admin.database().ref("/wallets/"+targetAddress+"/balance").once("value").then(snapshot => {
            if(snapshot.exists()){
                const taragetBeforebalance = snapshot.val();
                const targetafterbalance =  parseInt(taragetBeforebalance) + parseInt(amount);
                console.log("target balance exists", snapshot.val(), targetafterbalance);
                admin.database().ref("/wallets/"+targetAddress+"/balance").set(targetafterbalance);
            }else{
                console.log("target balance not exists", "0", amount);
                admin.database().ref("/wallets/"+targetAddress+"/balance").set(amount);
            }
            
            admin.database().ref("/wallets/"+targetAddress+"/transactions").push().set({
                targetAddress: address
                ,amount: body["amount"]
                ,billNo: body["billNo"]
                ,timestamp: new Date().toLocaleString()
                ,transactionType: "着金" 
                ,status : "02"
            });
            return response.status(200).end();
        }).catch(error => {
            console.log("reference error", error);
            return response.status(500).end();
        }); 

    }).catch(error => {
        console.log("reference error", error);
        return response.status(500).end();
    }); 

  } else {
   response.status(404).end();
  }
});

// 取引履歴
// url            : /transactionone
// hosting-url    : /v2/transaction
// method         : GET
// request-param  : address,key
// responce       : json(transaction-entity)
// responce-state : 200 -> success , 500 -> system-error
//
exports.transactionfor1 = functions.https.onRequest((request, response) => {
 if (request.method === "GET"){
    const address = request.query.address;
    const key     = request.query.key;
    admin.database().ref("/wallets/"+address+"/transactions/"+key).once("value").then(snapshot => {
        const transfer = snapshot.val();
        return response.status(200).json(transfer).end();
    }).catch(error => {
        console.log("reference error", error);
        return response.status(500).end();
    }); 

 } else{
    response.status(404).end();
 }
});

// 送金予約API
// url            : /reserve
// hosting-url    : /v2/reserve
// method         : POST
// request-param  : address
// content-type   : applicatoin/json
// request-body   :{"toAddress": "送金先アドレス" , "amount": "取引額 , "billNo": "請求no"}
// responce-state : 200 -> success , 406-> 残高不足 , 500 -> system-error
//
exports.reserve = functions.https.onRequest((request, response) => {
 if(request.method === "POST") {
  const body = request.body;
  const address = request.query.address;
  const amount = body["amount"];
  const targetAddress = body["toAddress"];
  
    admin.database().ref("/wallets/"+address+"/balance").once("value").then(snapshot => {
      // 自身の情報更新
        const beforebalance = snapshot.val();
        if(snapshot.exists()){
            const afterbalance = parseInt(beforebalance) - parseInt(amount);
            console.log("balance exists", beforebalance, afterbalance);
            if(0 > afterbalance){
                return response.status(406).send("残高不足").end();
            }
          // reserveなので、balanceは更新しない
          // admin.database().ref("/wallets/"+address+"/balance").set(afterbalance);
       }else{
           console.log("balance not exists", address);
            return response.status(406).send("残高なし").end();
        }

        const newKey = admin.database().ref("/wallets/"+address+"/transactions").push().key;
        const pushdata = {
            targetAddress: body["toAddress"]
            ,amount: body["amount"]
            ,billNo: body["billNo"]
            ,timestamp: new Date().toLocaleString()
            ,transactionType: "送金"
            ,status : "01" // 予約ステータス
            };
        var updates = {};
        updates["/wallets/"+address+"/transactions/"+newKey] = pushdata;
        admin.database().ref().update(updates);
        console.log("newKeys::",newKey);
        const responseData = {
          key: newKey
        };
        return response.status(200).send(responseData).end();

    }).catch(error => {
        console.log("reference error", error);
        return response.status(500).end();
    }); 

  } else {
   response.status(404).end();
  }
});

// 送金実行API
// url            : /reserveTransfer
// hosting-url    : /v2/reserve/transfer
// method         : POST
// request-param  : address,key
// responce-state : 200 -> success , 406-> 残高不足 , 500 -> system-error
//
exports.reserveTransfer = functions.https.onRequest((request, response) => {
 if(request.method === "POST") {
  const address = request.query.address;
  const key     = request.query.key;

    admin.database().ref("/wallets/"+address).once("value").then(snapshot => {
        
        const wallet = snapshot.val();
        if(!wallet){
          return response.status(500).send("address不正").end();
        }
        const transaction = wallet.transactions[key];
        if(!transaction){
          return response.status(500).send("key不正").end();
        }
        if(transaction.status !== "01" ){
          return response.status(500).send("status不正").end();
        }
        var updates = {};
        updates["/wallets/"+address+"/balance/"] = parseInt(wallet.balance) - parseInt(transaction.amount);
        updates["/wallets/"+address+"/transactions/"+key+"/status/"] = "02";
        admin.database().ref().update(updates);

        //targetAddressUpdate(address,transaction,key);
        //return response.status(200).end();
        return admin.database().ref("/wallets/"+transaction.targetAddress).once("value").then(snapshot => {
          const targetWallet = snapshot.val();
          const obj = {
            amount          : transaction.amount,
            billNo          : transaction.billNo,
            targetAddress   : address,
            timestamp       : new Date().toLocaleString(),
            transactionType : "着金" ,
            status          : "02"
          };

          var updates = {};
          updates["/wallets/"+transaction.targetAddress+"/balance/"] = parseInt(targetWallet.balance) + parseInt(transaction.amount);
          updates["/wallets/"+transaction.targetAddress+"/transactions/"+key+"/"] = obj;
          admin.database().ref().update(updates);
          return response.status(200).end();

        }).catch(error => {
          console.log("reference error", error);
          return response.status(500).send("kokoko").end();
        }); 

    }).catch(error => {
        console.log("reference error", error);
        return response.status(500).send("dododdo").end();
    }); 

  } else {
   response.status(404).end();
  }
});


// 本当はこれで実装したかった・・・(lint script error?)
// 非同期で対向アドレスの情報をupdateする。
//function targetAddressUpdate(myAddress,tranObject,key){
//  admin.database().ref("/wallets/"+tranObject.targetAddress).once("value").then(snapshot => {
//    const wallet = snapshot.val();
//    const obj = {
//      amount          : tranObject.amount,
//      billNo          : tranObject.billNo,
//      targetAddress   : myAddress,
//      timestamp       : new Date().toLocaleString(),
//      transactionType : "着金" ,
//      status          : "02"
//    };
//
//    var updates = {};
//    updates["/wallets/"+tranObject.targetAddress+"/balance/"] = parseInt(wallet.balance) + parseInt(tranObject.amount);
//    updates["/wallets/"+tranObject.targetAddress+"/transactions/"+key+"/"] = obj;
//    admin.database().ref().update(updates);
//  }).catch(error => {
//        console.log("param::",key,tranObject,"reference error", error);
//  }); 
//}

// 本当はtriggerでやりたかったが、sparkだと不可・・・。
//exports.updateTargetAddress = functions.database.ref("/wallets/{addressId}/transactions/{transactionId}/").onCreate((snapshot , context) => {
//    console.log("chk", context.param.addressId , context.param.transactionId);
//    return;
//});

//exports.helloWorld = functions.https.onRequest((request, response) => {
// response.send("Hello from Firebase!");
//});