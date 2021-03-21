const express = require('express');
const Cors = require('cors');
const axios = require('axios').default;

app = express();
port = process.env.PORT || 3001;


app.use(express.json())
app.use(Cors());


let rates;
let transactions;


axios.get('https://api.shakepay.co/rates')
.then(res => {
    rates=res.data
    getTransactions(rates)
})
.catch(err => console.error(err));

const getTransactions = (rates) =>{
    axios.get('https://shakepay.github.io/programming-exercise/web/transaction_history.json')
    .then(res => {
        transactions=res.data
        getDates(transactions, rates)
    
    })
    .catch(err => console.error(err));
}


const getDates = (transactions, rates) =>{
    let dateSet = new Set();

    transactions.forEach(transaction => {
        let date = transaction.createdAt.split("T")[0]
        dateSet.add(date)
    })
    Array.from(dateSet)
    let dates = Array.from(dateSet).reverse()
    getHist(dates, transactions, rates)
}


let x;
let amount;
let dir;
let cur;

let cadHist = {}
let btcHist = {}
let ethHist = {}

let curVal = 0
let btcVal = 0
let ethVal = 0
let daysAmountcad;
let daysAmountbtc;
let daysAmounteth;

let netWorth;
let netHist = []

let dateData;

const getHist = (dates, transactions, rates) =>{
    dates.forEach((date)=>{
        transactions.forEach((transaction)=>{
            x = transaction.createdAt.split("T")[0]
            amount = transaction.amount
            dir = transaction.direction
            cur = transaction.currency
            
            daysAmountcad = cadHist[date] && cadHist[date].amount
            daysAmountcad = btcHist[date] && btcHist[date].amount
            daysAmounteth = ethHist[date] && ethHist[date].amount

            
            if(x === date){
                if(cur === "CAD"){
                    if(dir === "credit"){
                        curVal += amount
                        cadHist[date] = {
                            amount:daysAmountcad ? daysAmountcad + amount : amount,
                            curVal:curVal
                        }
                    }
                    else if(dir === "debit"){
                        curVal -= amount
                        cadHist[date] = {
                            amount:daysAmountcad ? daysAmountcad - amount : amount,
                            curVal:curVal
                        }
                    }
                    else if(dir === null){
                        curVal -= amount
                        cadHist[date] = {
                            amount:daysAmountcad ? daysAmountcad - amount : amount,
                            curVal:curVal
                        }
                        btcHist[date] = {
                            amount:daysAmountbtc ? daysAmountbtc + transaction.to.amount : transaction.to.amount ,
                            curVal:btcVal+transaction.to.amount
                        }
                    }
                }

                else if(cur === "BTC"){
                    if(dir === "credit"){
                        btcVal += amount
                        btcHist[date] = {
                            amount:daysAmountbtc ? daysAmountbtc + amount : amount,
                            curVal:btcVal
                        }
                    }
                    else if(dir === "debit"){
                        btcVal -= amount
                        btcHist[date] = {
                            amount:daysAmountbtc ? daysAmountbtc - amount : amount,
                            curVal:btcVal
                        }
                    }
                    else if(dir === null){
                        btcVal -= amount
                        btcHist[date] = {
                            amount:daysAmountbtc ? daysAmountbtc - amount : amount,
                            curVal:btcVal
                        }
                        cadHist[date] = {
                            amount:daysAmountcad ? daysAmountcad + transaction.to.amount : transaction.to.amount ,
                            curVal:curVal+transaction.to.amount
                        }
                    }
                }

                else if(cur === "ETH"){
                    if(dir === "credit"){
                        ethVal += amount
                        ethHist[date] = {
                            amount:daysAmounteth ? daysAmounteth + amount : amount,
                            curVal:ethVal
                        }
                    }
                    else if(dir === "debit"){
                        ethVal -= amount
                        ethHist[date] = {
                            amount:daysAmounteth ? daysAmounteth - amount : amount,
                            curVal:ethVal
                        }
                    }
                    else if(dir === null){
                        ethVal -= amount
                        ethHist[date] = {
                            amount:daysAmounteth ? daysAmounteth - amount : amount,
                            curVal:ethVal
                        }
                        cadHist[date] = {
                            amount:daysAmountcad ? daysAmountcad + transaction.to.amount : transaction.to.amount ,
                            curVal:curVal+transaction.to.amount
                        }
                    }
                }
            }
        })
        netWorth = curVal + (btcVal*rates.BTC_CAD)+(ethVal*rates.ETH_CAD)
        netHist.push(netWorth)
        // console.log(netWorth)

        dateData = dates
    })
    console.log(ethHist)

    // Net worth = CAD_balance + (BTC_balance * BTC_CAD_rate) + (ETH_balance * ETH_CAD_rate)


}



app.get('/', (req, res) => res.status(200).send(rates));

app.get('/transactions', (req, res) => res.status(200).send(transactions));

app.use('/networth', (req, res) => res.status(200).send(netHist));

app.use('/dates', (req, res) => res.status(200).send(dateData));


app.listen(port, () => console.log(`listening on localhost: ${port}`))