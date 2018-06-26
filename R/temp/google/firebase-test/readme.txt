# data stracture
```
wallets
 {address} # 口座アドレス
   balance   # 残高
   transactions # 取引履歴
     transactionType  # 取引種別（着金 / 送金)
     date             # 取引日付
     amount           # 取引額
     targetAddress    # 取引先アドレス
     billNo           # 請求管理番号（ユーザ指定）
     status           # 予約(01) / 完了(02) # add
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


