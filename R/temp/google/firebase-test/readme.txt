# data stracture
```
wallets
 {address} # 口座アドレス
   balance   # 残高
   transactions # 取引履歴
    key            # sequence
     transactionType  # 取引種別（着金 / 送金)
     date             # 取引日付
     amount           # 取引額
     targetAddress    # 取引先アドレス
     billNo           # 請求管理番号（ユーザ指定）
     status           # 予約(01) / 完了(02) # add
   keys # 決済コード
    key            # sequence   
     expire           # 有効期限
     amount           # 取引額
     status           # コードステータス(done:使用済)
```


# API
## functions-host
```
https://us-central1-test-payment-ee17b.cloudfunctions.net
```
## hosting-host
```
https://test-payment-ee17b.firebaseapp.com/
```

## 送金API
```
url            : /transfer
hosting-url    : /v1/transfer
method         : POST
request-param  : address
content-type   : applicatoin/json
request-body   :{"toAddress": "送金先アドレス" , amount": "取引額 , "billNo": "請求no"}
responce-state : 200 -> success , 406-> 残高不足 , 500 -> system-error
```

## 取引履歴照会
```
url            : /transaction
hosting-url    : /v1/transactions
method         : GET
request-param  : address
responce       : json(transaction-entity)
responce-state : 200 -> success , 500 -> system-error
```

## 残高取得API
``` 
url            : /wallet
hosting-url    : /v1/wallet
method         : GET
request-param  : address
responce       : {"balance": "残高"}
responce-state : 200 -> success , 500 -> system-error
```

# API(v2)
## 送金予約API
```
url            : /reserve
hosting-url    : /v2/reserve
method         : POST
content-type   : applicatoin/json
request-body   :{"toAddress": "送金先アドレス" , amount": "取引額 , "billNo": "請求no"}
responce-state : 200 -> success , 406-> 残高不足 , 500 -> system-error
```

## 取引履歴（1件)
```
url            : /transaction
hosting-url    : /v2/transaction
method         : GET
request-param  : address,key
responce       : json(transaction-entity)
responce-state : 200 -> success , 500 -> system-error
```

## 送金実行API
```
url            : /reserveTransfer
hosting-url    : /v2/reserve/transfer
method         : POST
request-param  : address,key
content-type   : applicatoin/json
responce-state : 200 -> success , 406-> 残高不足 , 500 -> system-error
```

## qrコードキー取得API
```
url            : /newKey
hosting-url    : TBD
method         : GET TODO://本当はPOST説?
request-param  : address
content-type   : applicatoin/json
request-body   : -
responce-body  : {key:xxx}
responce-state : 200 -> success , 406-> 残高不足 , 500 -> system-error
```

## qrコードキーステータスチェックAPI
```
url            : /keyStatus
hosting-url    : TBD
method         : GET
request-param  : address,key TODO://本来はkeyだけで取得？
responce       : json(transaction-entity)
responce-state : 200 -> success , 500 -> system-error
```

## 送金API(仮実同時)
```
url            : /transfer2
hosting-url    : /v2/transfer
method         : POST
request-param  : ー
content-type   : applicatoin/json
request-body   :{"targetKey": "対象決済コード" , toAddress": 金先アドレス" , "amount": "取引額 , "billNo": "請求no"}
responce-state : 200 -> success , 406-> 残高不足 , 500 -> system-error
```

