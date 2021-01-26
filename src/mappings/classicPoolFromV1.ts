import {log, BigInt, BigDecimal, Address, ethereum, dataSource} from '@graphprotocol/graph-ts'
import {
    LiquidityHistory,
    LiquidityPosition,
    Pair,
    Token,
    Swap,
    OrderHistory,
    LpToken,
    PairTrader
} from '../types/schema'
import {DODO as DODOTemplate, DODOLpToken as DODOLpTokenTemplate} from '../types/templates'
import {
    ONE_BI,
    ZERO_BD,
    ZERO_BI,
    convertTokenToDecimal,
    TYPE_CLASSICAL_POOL,
    createToken,
    createUser,
    createLpToken,
    getDODOZoo,
    getPMMState,
    BI_18,
    SOURCE_POOL_SWAP,
    updatePairTraderCount,
    fetchTokenBalance
} from './helpers'
import {DODOBirth} from '../types/DodoZoo/DodoZoo'
import {Deposit, Withdraw, DODO, BuyBaseToken, SellBaseToken} from '../types/templates/DODO/DODO';
import {updatePairDayData, updateTokenDayData} from "./dayUpdates"
import {getUSDCPrice} from "./pricing"

import {
    SMART_ROUTE_ADDRESSES,
    ADDRESS_ZERO,
    DODOZooID,
} from "./constant"

const POOLS_ADDRESS: string[] = [
    "0x75c23271661d9d143dcb617222bc4bec783eff34",//WETH-USDC
    "0x562c0b218cc9ba06d9eb42f3aef54c54cc5a4650",//LINK-USDC
    "0x9d9793e1e18cdee6cf63818315d55244f73ec006",//FIN-USDT
    "0xca7b0632bd0e646b0f823927d3d2e61b00fe4d80",//SNX-USDC
    "0x0d04146b2fe5d267629a7eb341fb4388dcdbd22f",//COMP-USDC
    "0x2109f78b46a789125598f5ad2b7f243751c2934d",//WBTC-USDC
    "0x1b7902a66f133d899130bf44d7d879da89913b2e",//YFI-USDC
    "0x1a7fe5d6f0bb2d071e16bdd52c863233bbfd38e9",//WETH-USDT
    "0x8876819535b48b551c9e97ebc07332c7482b4b2d",//DODO-USDT
    "0xc9f93163c99695c6526b799ebca2207fdf7d61ad",//USDT-USDC
    "0x94512fd4fb4feb63a6c0f4bedecc4a00ee260528",//AAVE-USDC
    "0x85f9569b69083c3e6aeffd301bb2c65606b5d575",//wCRES-USDT
]

const BASE_TOKENS: string[] = [
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",//WETH
    "0x514910771af9ca656af840dff83e8264ecf986ca",//LINK
    "0x054f76beed60ab6dbeb23502178c52d6c5debe40",//FIN
    "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",//SNX
    "0xc00e94cb662c3520282e6f5717214004a7f26888",//COMP
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",//WBTC
    "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",//YFI
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",//WETH
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",//DODO
    "0xdac17f958d2ee523a2206206994597c13d831ec7",//USDT
    "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",//AAVE
    "0xa0afaa285ce85974c3c881256cb7f225e3a1178a",//wCRES
]

const QUOTE_TOKENS: string[] = [
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",//USDC
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",//USDC
    "0xdac17f958d2ee523a2206206994597c13d831ec7",//USDT
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",//USDC
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",//USDC
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",//USDC
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",//USDC
    "0xdac17f958d2ee523a2206206994597c13d831ec7",//USDT
    "0xdac17f958d2ee523a2206206994597c13d831ec7",//USDT
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",//USDC
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",//USDC
    "0xdac17f958d2ee523a2206206994597c13d831ec7",//USDT
]

const BASE_LP_TOKENS: string[] = [
    "0xc11eccdee225d644f873776a68a02ecd8c015697",//WETH
    "0xf03f3d2fbee37f92ec91ae927a8019cacef4b738",//LINK
    "0x7c4a6813b6af50a2aa2720d861c796a990245383",//FIN
    "0x5bd1b7d3930d7a5e8fd5aeec6b931c822c8be14e",//SNX
    "0x53cf4694b427fcef9bb1f4438b68df51a10228d0",//COMP
    "0x2ec2a42901c761b295a9e6b95200cd0bdaa474eb",//WBTC
    "0xe2852c572fc42c9e2ec03197defa42c647e89291",//YFI
    "0x1270be1bf727447270f237115f0943011e35ee3e",//WETH
    "0x3befc1f0f6cfe0ea852ae61709de370599c88bde ",//DODO
    "0x50b11247bf14ee5116c855cde9963fa376fcec86",//USDT
    "0x30ad5b6d4e531591591113b49eae2fafbc2236d5",//AAVE
    "0xcfba2e0f1bbf6ad96960d8866316b02e36ed1761",//wCRES
]

const QUOTE_LP_TOKENS: string[] = [
    "0x6a5eb3555cbbd29016ba6f6ffbccee28d57b2932",
    "0x0f769bc3ecbda8e0d78280c88e31609e899a1f78",
    "0xa62bf27fd1d64d488b609a09705a28a9b5240b9c",
    "0x1b06a22b20362b4115388ab8ca3ed0972230d78a",
    "0x51baf2656778ad6d67b19a419f91d38c3d0b87b6",
    "0x0cdb21e20597d753c90458f5ef2083f6695eb794",
    "0xd9d0bd18ddfa753d0c88a060ffb60657bb0d7a07",
    "0x3dc2eb2f59ddca985174bb20ae9141ba66cfd2d3",
    "0x1e5bfc8c1225a6ce59504988f823c44e08414a49",
    "0x05a54b466f01510e92c02d3a180bae83a64baab8",
    "0x5840a9e733960f591856a5d13f6366658535bbe5",
    "0xe236b57de7f3e9c3921391c4cb9a42d9632c0022"
]

function insertAllPairs4V1Mainnet(event: ethereum.Event): void {

    if (DODOZooID != "dodoex-v2") {
        return;
    }

    let dodoZoo = getDODOZoo();

    for (let i = 0; i < POOLS_ADDRESS.length; i++) {

        if (Pair.load(POOLS_ADDRESS[i].toString()) == null) {
            //tokens
            let baseToken = createToken(Address.fromString(BASE_TOKENS[i]), event);
            let quoteToken = createToken(Address.fromString(QUOTE_TOKENS[i]), event);

            let pair = new Pair(POOLS_ADDRESS[i].toString()) as Pair

            pair.baseToken = baseToken.id;
            pair.quoteToken = quoteToken.id;
            pair.type = TYPE_CLASSICAL_POOL;

            pair.creator = Address.fromString(ADDRESS_ZERO);
            pair.createdAtTimestamp = event.block.timestamp;
            pair.createdAtBlockNumber = event.block.number;

            let baseLpToken = createLpToken(Address.fromString(BASE_LP_TOKENS[i]), pair);
            let quoteLpToken = createLpToken(Address.fromString(QUOTE_LP_TOKENS[i]), pair);

            pair.baseLpToken = baseLpToken.id;
            pair.quoteLpToken = quoteLpToken.id;
            pair.txCount = ZERO_BI;
            pair.volumeBaseToken = ZERO_BD;
            pair.volumeQuoteToken = ZERO_BD;
            pair.tradeVolumeUSDC = ZERO_BD;
            pair.reserveUSDC = ZERO_BD;
            pair.liquidityProviderCount = ZERO_BI;
            pair.untrackedBaseVolume = ZERO_BD;
            pair.untrackedQuoteVolume = ZERO_BD;
            pair.baseLpFee = ZERO_BD;
            pair.quoteLpFee = ZERO_BD;
            pair.lpFeeUSDC = ZERO_BD;
            pair.traderCount = ZERO_BI;

            pair.i = ZERO_BI;
            pair.k = ZERO_BI;
            pair.baseReserve = ZERO_BD;
            pair.quoteReserve = ZERO_BD;

            pair.lpFeeRate = ZERO_BD;

            pair.mtFeeRateModel = Address.fromString(ADDRESS_ZERO);
            pair.maintainer = Address.fromString(ADDRESS_ZERO);

            pair.save();

            dodoZoo.pairCount = dodoZoo.pairCount.plus(ONE_BI);
            DODOTemplate.create(Address.fromString(POOLS_ADDRESS[i]));

            DODOLpTokenTemplate.create(Address.fromString(BASE_LP_TOKENS[i]));
            DODOLpTokenTemplate.create(Address.fromString(QUOTE_LP_TOKENS[i]));
        }

    }

    dodoZoo.save();

}

export function handleDODOBirth(event: DODOBirth): void {
    insertAllPairs4V1Mainnet(event);

    if (dataSource.address().toHexString() != "0x3a97247df274a17c59a3bd12735ea3fcdfb49950") {
        let dodoZoo = getDODOZoo();

        let pair = Pair.load(event.params.newBorn.toHexString());
        if (pair == null) {
            //tokens
            let dodo = DODO.bind(event.params.newBorn);
            let pair = new Pair(event.params.newBorn.toHexString()) as Pair;

            let baseToken = createToken(event.params.baseToken, event);
            let quoteToken = createToken(event.params.quoteToken, event);
            let baseLpToken = createLpToken(dodo._BASE_CAPITAL_TOKEN_(), pair);
            let quoteLpToken = createLpToken(dodo._QUOTE_CAPITAL_TOKEN_(), pair);


            pair.baseLpToken = baseLpToken.id;
            pair.quoteLpToken = quoteLpToken.id;
            pair.baseToken = baseToken.id;
            pair.quoteToken = quoteToken.id;
            pair.type = TYPE_CLASSICAL_POOL;

            pair.creator = Address.fromString(ADDRESS_ZERO);
            pair.createdAtTimestamp = event.block.timestamp;
            pair.createdAtBlockNumber = event.block.number;

            pair.txCount = ZERO_BI;
            pair.volumeBaseToken = ZERO_BD;
            pair.volumeQuoteToken = ZERO_BD;
            pair.tradeVolumeUSDC = ZERO_BD;
            pair.reserveUSDC = ZERO_BD;
            pair.liquidityProviderCount = ZERO_BI;
            pair.untrackedBaseVolume = ZERO_BD;
            pair.untrackedQuoteVolume = ZERO_BD;
            pair.baseLpFee = ZERO_BD;
            pair.quoteLpFee = ZERO_BD;
            pair.lpFeeUSDC = ZERO_BD;
            pair.traderCount = ZERO_BI;

            pair.i = ZERO_BI;
            pair.k = ZERO_BI;
            pair.baseReserve = ZERO_BD;
            pair.quoteReserve = ZERO_BD;

            pair.lpFeeRate = ZERO_BD;

            pair.mtFeeRateModel = Address.fromString(ADDRESS_ZERO);
            pair.maintainer = Address.fromString(ADDRESS_ZERO);

            pair.save();

            dodoZoo.pairCount = dodoZoo.pairCount.plus(ONE_BI);
            DODOTemplate.create(event.params.newBorn);

            DODOLpTokenTemplate.create(Address.fromString(baseLpToken.id));
            DODOLpTokenTemplate.create(Address.fromString(quoteLpToken.id));

            dodoZoo.save();
        }
    }

}

export function handleDeposit(event: Deposit): void {
    let pair = Pair.load(event.address.toHexString());
    let toUser = createUser(event.params.receiver);
    let fromUser = createUser(event.transaction.from);
    let baseToken = Token.load(pair.baseToken);
    let quoteToken = Token.load(pair.quoteToken);

    let baseLpToken = createLpToken(Address.fromString(pair.baseLpToken), pair as Pair);
    let quoteLpToken = createLpToken(Address.fromString(pair.quoteLpToken), pair as Pair);

    let amount = convertTokenToDecimal(event.params.amount, event.params.isBaseToken ? baseToken.decimals : quoteToken.decimals);
    let dealedSharesAmount: BigDecimal;
    //更新用户LP token信息
    let liquidityPositionID: string, lpToken: LpToken;
    if (event.params.isBaseToken) {
        liquidityPositionID = event.params.receiver.toHexString().concat("-").concat(pair.baseLpToken);
        lpToken = LpToken.load(pair.baseLpToken) as LpToken;
        dealedSharesAmount = convertTokenToDecimal(event.params.lpTokenAmount, baseLpToken.decimals);
    } else {
        liquidityPositionID = event.params.receiver.toHexString().concat("-").concat(pair.quoteLpToken);
        lpToken = LpToken.load(pair.quoteLpToken) as LpToken;
        dealedSharesAmount = convertTokenToDecimal(event.params.lpTokenAmount, quoteLpToken.decimals);
    }
    let liquidityPosition = LiquidityPosition.load(liquidityPositionID);
    if (liquidityPosition == null) {
        liquidityPosition = new LiquidityPosition(liquidityPositionID);
        liquidityPosition.pair = event.address.toHexString();
        liquidityPosition.user = event.params.receiver.toHexString();
        liquidityPosition.liquidityTokenBalance = ZERO_BD;
        liquidityPosition.lpToken = lpToken.id;
    }
    liquidityPosition.lastTxTime = event.block.timestamp;
    liquidityPosition.liquidityTokenBalance = liquidityPosition.liquidityTokenBalance.plus(dealedSharesAmount);

    //增加shares发生时的快照
    let liquidityHistoryID = event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString());
    let liquidityHistory = LiquidityHistory.load(liquidityHistoryID);
    if (liquidityHistory == null) {
        liquidityHistory = new LiquidityHistory(liquidityHistoryID);
        liquidityHistory.block = event.block.number;
        liquidityHistory.hash = event.transaction.hash.toHexString();
        liquidityHistory.from = event.transaction.from;
        liquidityHistory.pair = event.address.toHexString();
        liquidityHistory.timestamp = event.block.timestamp;
        liquidityHistory.user = event.params.receiver.toHexString();
        liquidityHistory.amount = dealedSharesAmount;
        liquidityHistory.balance = liquidityPosition.liquidityTokenBalance;
        liquidityHistory.lpToken = lpToken.id;
        liquidityHistory.type = "DEPOSIT";
    }

    liquidityPosition.save();
    liquidityHistory.save();

    //不更新pair基础信息（i，k，B0，Q0，B，Q）
    if (event.params.isBaseToken) {
        pair.baseReserve = pair.baseReserve.plus(amount);
    } else {
        pair.quoteReserve = pair.quoteReserve.plus(amount);
    }

    fromUser.txCount = fromUser.txCount.plus(ONE_BI);
    toUser.txCount = toUser.txCount.plus(ONE_BI);

    baseToken.txCount = baseToken.txCount.plus(ONE_BI);
    quoteToken.txCount = quoteToken.txCount.plus(ONE_BI);

    lpToken.totalSupply = lpToken.totalSupply.plus(event.params.lpTokenAmount);

    pair.save();
    fromUser.save();
    toUser.save();
    baseToken.save();
    quoteToken.save();
    lpToken.save();

    //更新DODOZoo
    let dodoZoo = getDODOZoo();
    dodoZoo.txCount = dodoZoo.txCount.plus(ONE_BI);
    dodoZoo.save();
}

export function handleWithdraw(event: Withdraw): void {
    let pair = Pair.load(event.address.toHexString());
    let toUser = createUser(event.params.receiver);
    let fromUser = createUser(event.transaction.from);
    let baseToken = Token.load(pair.baseToken);
    let quoteToken = Token.load(pair.quoteToken);
    let baseLpToken = createLpToken(Address.fromString(pair.baseLpToken), pair as Pair);
    let quoteLpToken = createLpToken(Address.fromString(pair.quoteLpToken), pair as Pair);

    let amount = convertTokenToDecimal(event.params.amount, event.params.isBaseToken ? baseToken.decimals : quoteToken.decimals);
    let dealedSharesAmount: BigDecimal;
    //更新用户LP token信息
    let liquidityPositionID: string, lpToken: LpToken;
    if (event.params.isBaseToken) {
        liquidityPositionID = event.params.receiver.toHexString().concat("-").concat(pair.baseLpToken);
        lpToken = LpToken.load(pair.baseLpToken) as LpToken;
        dealedSharesAmount = convertTokenToDecimal(event.params.lpTokenAmount, baseLpToken.decimals);
    } else {
        liquidityPositionID = event.params.receiver.toHexString().concat("-").concat(pair.quoteLpToken);
        lpToken = LpToken.load(pair.quoteLpToken) as LpToken;
        dealedSharesAmount = convertTokenToDecimal(event.params.lpTokenAmount, quoteLpToken.decimals);
    }
    let liquidityPosition = LiquidityPosition.load(liquidityPositionID);
    if (liquidityPosition == null) {
        liquidityPosition = new LiquidityPosition(liquidityPositionID);
        liquidityPosition.pair = event.address.toHexString();
        liquidityPosition.user = event.params.receiver.toHexString();
        liquidityPosition.liquidityTokenBalance = convertTokenToDecimal(fetchTokenBalance(Address.fromString(lpToken.id), event.params.receiver), lpToken.decimals);
        liquidityPosition.lpToken = lpToken.id;
        liquidityPosition.lastTxTime = ZERO_BI;
    } else {
        liquidityPosition.liquidityTokenBalance = liquidityPosition.liquidityTokenBalance.minus(dealedSharesAmount);
    }

    //增加shares发生时的快照
    let liquidityHistoryID = event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString());
    let liquidityHistory = LiquidityHistory.load(liquidityHistoryID);
    if (liquidityHistory == null) {
        liquidityHistory = new LiquidityHistory(liquidityHistoryID);
        liquidityHistory.block = event.block.number;
        liquidityHistory.hash = event.transaction.hash.toHexString();
        liquidityHistory.from = event.transaction.from;
        liquidityHistory.pair = event.address.toHexString();
        liquidityHistory.timestamp = event.block.timestamp;
        liquidityHistory.user = event.params.receiver.toHexString();
        liquidityHistory.amount = dealedSharesAmount;
        liquidityHistory.lpToken = lpToken.id;
        liquidityHistory.balance = liquidityPosition.liquidityTokenBalance;
        liquidityHistory.type = "WITHDRAW";
    }

    liquidityPosition.save();
    liquidityHistory.save();

    //更新基础信息
    if (event.params.isBaseToken) {
        pair.baseReserve = pair.baseReserve.minus(amount);
    } else {
        pair.quoteReserve = pair.quoteReserve.minus(amount);
    }

    fromUser.txCount = fromUser.txCount.plus(ONE_BI);
    toUser.txCount = toUser.txCount.plus(ONE_BI);

    baseToken.txCount = baseToken.txCount.plus(ONE_BI);
    quoteToken.txCount = quoteToken.txCount.plus(ONE_BI);

    lpToken.totalSupply = lpToken.totalSupply.minus(event.params.lpTokenAmount);

    pair.save();
    fromUser.save();
    toUser.save();
    baseToken.save();
    quoteToken.save();
    lpToken.save();


    //更新DODOZoo
    let dodoZoo = getDODOZoo();
    dodoZoo.txCount = dodoZoo.txCount.plus(ONE_BI);
    dodoZoo.save();
}

export function handleSellBaseToken(event: SellBaseToken): void {
    //base data
    let swapID = event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString());
    let pair = Pair.load(event.address.toHexString());
    let user = createUser(event.transaction.from);
    let fromToken = createToken(Address.fromString(pair.baseToken), event);
    let toToken = createToken(Address.fromString(pair.quoteToken), event);
    let dealedFromAmount = convertTokenToDecimal(event.params.payBase, fromToken.decimals);
    let dealedToAmount = convertTokenToDecimal(event.params.receiveQuote, toToken.decimals);
    let fromPrice = getUSDCPrice(pair as Pair, true, event.block.number);
    let toPrice = getUSDCPrice(pair as Pair, false, event.block.number);
    let untrackedBaseVolume = ZERO_BD;
    let untrackedQuoteVolume = ZERO_BD;

    let baseToken: Token, quoteToken: Token, baseVolume: BigDecimal, quoteVolume: BigDecimal, baseLpFee: BigDecimal,
        quoteLpFee: BigDecimal, lpFeeUsdc: BigDecimal;
    if (fromToken.id == pair.baseToken) {
        baseToken = fromToken as Token;
        quoteToken = toToken as Token;
        baseVolume = dealedFromAmount;
        quoteVolume = dealedToAmount;

        baseLpFee = ZERO_BD;
        quoteLpFee = quoteVolume.times(pair.lpFeeRate).div(BI_18.toBigDecimal());

        if (fromPrice.equals(ZERO_BD)) {
            untrackedBaseVolume = dealedFromAmount;
        }
        if (toPrice.equals(ZERO_BD)) {
            untrackedQuoteVolume = dealedToAmount;
        }
    } else {
        baseToken = toToken as Token;
        quoteToken = fromToken as Token;
        baseVolume = dealedToAmount;
        quoteVolume = dealedFromAmount;

        baseLpFee = baseVolume.times(pair.lpFeeRate).div(BI_18.toBigDecimal());
        quoteLpFee = ZERO_BD;

        if (fromPrice.equals(ZERO_BD)) {
            untrackedBaseVolume = dealedToAmount;
        }
        if (toPrice.equals(ZERO_BD)) {
            untrackedQuoteVolume = dealedFromAmount;
        }
    }

    let swappedUSDC = dealedFromAmount.times(fromPrice).plus(dealedToAmount.times(toPrice));
    lpFeeUsdc = swappedUSDC.times(pair.lpFeeRate).div(BI_18.toBigDecimal());

    //1、更新pair
    pair.txCount = pair.txCount.plus(ONE_BI);
    pair.volumeBaseToken = pair.volumeBaseToken.plus(baseVolume);
    pair.volumeQuoteToken = pair.volumeQuoteToken.plus(quoteVolume);
    pair.tradeVolumeUSDC = pair.tradeVolumeUSDC.plus(swappedUSDC);
    pair.baseLpFee = pair.baseLpFee.plus(baseLpFee);
    pair.quoteLpFee = pair.quoteLpFee.plus(quoteLpFee);
    pair.lpFeeUSDC = lpFeeUsdc;
    pair.untrackedBaseVolume = pair.untrackedBaseVolume.plus(untrackedBaseVolume);
    pair.untrackedQuoteVolume = pair.untrackedQuoteVolume.plus(untrackedQuoteVolume);
    pair.save();

    //2、更新两个token的记录数据
    fromToken.txCount = fromToken.txCount.plus(ONE_BI);
    fromToken.tradeVolume = fromToken.tradeVolume.plus(dealedFromAmount);
    fromToken.tradeVolumeUSDC = fromToken.tradeVolumeUSDC.plus(dealedFromAmount.times(fromPrice));
    fromToken.priceUSDC = fromPrice;
    fromToken.feeUSDC = lpFeeUsdc.div(BigDecimal.fromString("2"));
    if (fromPrice.equals(ZERO_BD)) {
        fromToken.untrackedVolume = fromToken.untrackedVolume.plus(dealedFromAmount);
    }
    fromToken.save();

    toToken.txCount = toToken.txCount.plus(ONE_BI);
    toToken.tradeVolume = toToken.tradeVolume.plus(dealedFromAmount);
    toToken.tradeVolumeUSDC = toToken.tradeVolumeUSDC.plus(dealedToAmount.times(toPrice));
    toToken.priceUSDC = toPrice;
    toToken.feeUSDC = lpFeeUsdc.div(BigDecimal.fromString("2"));
    if (fromPrice.equals(ZERO_BD)) {
        fromToken.untrackedVolume = fromToken.untrackedVolume.plus(dealedFromAmount);
    }
    toToken.save();

    //3、更新用户信息
    user.txCount = user.txCount.plus(ONE_BI);
    user.usdcSwapped = user.usdcSwapped.plus(swappedUSDC);
    user.save();

    //4、增加swap条目
    let swap = Swap.load(swapID);
    if (swap == null) {
        swap = new Swap(swapID)
        swap.hash = event.transaction.hash.toHexString();
        swap.from = event.transaction.from;
        swap.to = event.params.seller;//to address
        swap.logIndex = event.logIndex;
        swap.sender = event.params.seller;
        swap.timestamp = event.block.timestamp;
        swap.amountIn = dealedFromAmount;
        swap.amountOut = dealedToAmount;
        swap.amountUSDC = swappedUSDC;
        swap.fromToken = fromToken.id;
        swap.toToken = toToken.id;
        swap.pair = pair.id;
        swap.baseLpFee = baseLpFee;
        swap.quoteLpFee = quoteLpFee;
        swap.lpFeeUSDC = lpFeeUsdc.div(BigDecimal.fromString("2"));
        swap.baseVolume = baseVolume;
        swap.quoteVolume = quoteVolume;
        swap.save();
    }

    //1、同步到OrderHistory
    let orderHistory = OrderHistory.load(swapID);
    if (SMART_ROUTE_ADDRESSES.indexOf(event.params.seller.toHexString()) == -1 && orderHistory == null) {
        orderHistory = new OrderHistory(swapID);
        orderHistory.source = SOURCE_POOL_SWAP;
        orderHistory.hash = event.transaction.hash.toHexString();
        orderHistory.timestamp = event.block.timestamp;
        orderHistory.block = event.block.number;
        orderHistory.fromToken = fromToken.id;
        orderHistory.toToken = toToken.id;
        orderHistory.from = event.transaction.from;
        orderHistory.to = event.params.seller;
        orderHistory.sender = event.params.seller;
        orderHistory.amountIn = dealedFromAmount;
        orderHistory.amountOut = dealedToAmount;
        orderHistory.logIndex = event.logIndex;
        orderHistory.amountUSDC = swappedUSDC;
        orderHistory.tradingReward = ZERO_BD;
        orderHistory.save();
    }

    // 更新交易人数
    updatePairTraderCount(event.transaction.from, event.params.seller, pair as Pair, event);

    //更新DODOZoo
    let dodoZoo = getDODOZoo();
    dodoZoo.txCount = dodoZoo.txCount.plus(ONE_BI);
    dodoZoo.save();

    //更新报表数据
    let pairDayData = updatePairDayData(event);
    pairDayData.untrackedBaseVolume = pairDayData.untrackedBaseVolume.plus(untrackedBaseVolume);
    pairDayData.untrackedQuoteVolume = pairDayData.untrackedBaseVolume.plus(untrackedQuoteVolume);

    let baseDayData = updateTokenDayData(baseToken, event);
    baseDayData.untrackedVolume = baseDayData.untrackedVolume.plus(untrackedBaseVolume);

    let quoteDayData = updateTokenDayData(quoteToken, event);
    quoteDayData.untrackedVolume = baseDayData.untrackedVolume.plus(untrackedQuoteVolume);
    let fromTraderPair = PairTrader.load(event.transaction.from.toHexString().concat("-").concat(pair.id));
    if(fromTraderPair.lastTxTime.lt(BigInt.fromI32(pairDayData.date))){
        fromTraderPair.lastTxTime = event.block.timestamp;
        pairDayData.dailyTraders = pairDayData.dailyTraders.plus(ONE_BI);
        baseDayData.dailyTraders = baseDayData.dailyTraders.plus(ONE_BI);
        quoteDayData.dailyTraders = quoteDayData.dailyTraders.plus(ONE_BI);
    }
    fromTraderPair.save();

    let toTraderPair = PairTrader.load(event.params.seller.toHexString().concat("-").concat(pair.id));
    if(toTraderPair.lastTxTime.lt(BigInt.fromI32(pairDayData.date))){
        toTraderPair.lastTxTime = event.block.timestamp;
        pairDayData.dailyTraders = pairDayData.dailyTraders.plus(ONE_BI);
        baseDayData.dailyTraders = baseDayData.dailyTraders.plus(ONE_BI);
        quoteDayData.dailyTraders = quoteDayData.dailyTraders.plus(ONE_BI);
    }
    toTraderPair.save();

    pairDayData.save();
    baseDayData.save();
    quoteDayData.save();
}

export function handleBuyBaseToken(event: BuyBaseToken): void {
    //base data
    let swapID = event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString());
    let pair = Pair.load(event.address.toHexString());
    let user = createUser(event.transaction.from);
    let fromToken = createToken(Address.fromString(pair.quoteToken), event);
    let toToken = createToken(Address.fromString(pair.baseToken), event);
    let dealedFromAmount = convertTokenToDecimal(event.params.payQuote, fromToken.decimals);
    let dealedToAmount = convertTokenToDecimal(event.params.receiveBase, toToken.decimals);
    let fromPrice = getUSDCPrice(pair as Pair, true, event.block.number);
    let toPrice = getUSDCPrice(pair as Pair, false, event.block.number);
    let untrackedBaseVolume = ZERO_BD;
    let untrackedQuoteVolume = ZERO_BD;

    let baseToken: Token, quoteToken: Token, baseVolume: BigDecimal, quoteVolume: BigDecimal, baseLpFee: BigDecimal,
        quoteLpFee: BigDecimal, lpFeeUsdc: BigDecimal;
    if (fromToken.id == pair.baseToken) {
        baseToken = fromToken as Token;
        quoteToken = toToken as Token;
        baseVolume = dealedFromAmount;
        quoteVolume = dealedToAmount;

        baseLpFee = ZERO_BD;
        quoteLpFee = quoteVolume.times(pair.lpFeeRate).div(BI_18.toBigDecimal());

        if (fromPrice.equals(ZERO_BD)) {
            untrackedBaseVolume = dealedFromAmount;
        }
        if (toPrice.equals(ZERO_BD)) {
            untrackedQuoteVolume = dealedToAmount;
        }
    } else {
        baseToken = toToken as Token;
        quoteToken = fromToken as Token;
        baseVolume = dealedToAmount;
        quoteVolume = dealedFromAmount;

        baseLpFee = baseVolume.times(pair.lpFeeRate).div(BI_18.toBigDecimal());
        quoteLpFee = ZERO_BD;

        if (fromPrice.equals(ZERO_BD)) {
            untrackedBaseVolume = dealedToAmount;
        }
        if (toPrice.equals(ZERO_BD)) {
            untrackedQuoteVolume = dealedFromAmount;
        }
    }


    let swappedUSDC = dealedFromAmount.times(fromPrice).plus(dealedToAmount.times(toPrice));
    lpFeeUsdc = swappedUSDC.times(pair.lpFeeRate).div(BI_18.toBigDecimal());

    //1、更新pair
    pair.txCount = pair.txCount.plus(ONE_BI);
    pair.volumeBaseToken = pair.volumeBaseToken.plus(baseVolume);
    pair.volumeQuoteToken = pair.volumeQuoteToken.plus(quoteVolume);
    pair.tradeVolumeUSDC = pair.tradeVolumeUSDC.plus(swappedUSDC);
    pair.baseLpFee = pair.baseLpFee.plus(baseLpFee);
    pair.quoteLpFee = pair.quoteLpFee.plus(quoteLpFee);
    pair.lpFeeUSDC = lpFeeUsdc;
    pair.untrackedBaseVolume = pair.untrackedBaseVolume.plus(untrackedBaseVolume);
    pair.untrackedQuoteVolume = pair.untrackedQuoteVolume.plus(untrackedQuoteVolume);
    pair.save();

    //2、更新两个token的记录数据
    fromToken.txCount = fromToken.txCount.plus(ONE_BI);
    fromToken.tradeVolume = fromToken.tradeVolume.plus(dealedFromAmount);
    fromToken.tradeVolumeUSDC = fromToken.tradeVolumeUSDC.plus(dealedFromAmount.times(fromPrice));
    fromToken.priceUSDC = fromPrice;
    fromToken.feeUSDC = lpFeeUsdc.div(BigDecimal.fromString("2"));
    if (fromPrice.equals(ZERO_BD)) {
        fromToken.untrackedVolume = fromToken.untrackedVolume.plus(dealedFromAmount);
    }
    fromToken.save();

    toToken.txCount = toToken.txCount.plus(ONE_BI);
    toToken.tradeVolume = toToken.tradeVolume.plus(dealedFromAmount);
    toToken.tradeVolumeUSDC = toToken.tradeVolumeUSDC.plus(dealedToAmount.times(toPrice));
    toToken.priceUSDC = toPrice;
    toToken.feeUSDC = lpFeeUsdc.div(BigDecimal.fromString("2"));
    if (toPrice.equals(ZERO_BD)) {
        toToken.untrackedVolume = toToken.untrackedVolume.plus(dealedToAmount);
    }
    toToken.save();

    //3、更新用户信息
    user.txCount = user.txCount.plus(ONE_BI);
    user.usdcSwapped = user.usdcSwapped.plus(swappedUSDC);
    user.save();

    //4、增加swap条目
    let swap = Swap.load(swapID);
    if (swap == null) {
        swap = new Swap(swapID)
        swap.hash = event.transaction.hash.toHexString();
        swap.from = event.transaction.from;
        swap.to = event.params.buyer;//to address
        swap.logIndex = event.logIndex;
        swap.sender = event.params.buyer;
        swap.timestamp = event.block.timestamp;
        swap.amountIn = dealedFromAmount;
        swap.amountOut = dealedToAmount;
        swap.amountUSDC = swappedUSDC;
        swap.fromToken = fromToken.id;
        swap.toToken = toToken.id;
        swap.pair = pair.id;
        swap.baseLpFee = baseLpFee;
        swap.quoteLpFee = quoteLpFee;
        swap.lpFeeUSDC = lpFeeUsdc.div(BigDecimal.fromString("2"));
        swap.baseVolume = baseVolume;
        swap.quoteVolume = quoteVolume;
        swap.save();
    }

    //1、同步到OrderHistory
    let orderHistory = OrderHistory.load(swapID);
    if (SMART_ROUTE_ADDRESSES.indexOf(event.params.buyer.toHexString()) == -1 && orderHistory == null) {
        orderHistory = new OrderHistory(swapID);
        orderHistory.source = SOURCE_POOL_SWAP;
        orderHistory.hash = event.transaction.hash.toHexString();
        orderHistory.timestamp = event.block.timestamp;
        orderHistory.block = event.block.number;
        orderHistory.fromToken = fromToken.id;
        orderHistory.toToken = toToken.id;
        orderHistory.from = event.transaction.from;
        orderHistory.to = event.params.buyer;
        orderHistory.sender = event.params.buyer;
        orderHistory.amountIn = dealedFromAmount;
        orderHistory.amountOut = dealedToAmount;
        orderHistory.logIndex = event.logIndex;
        orderHistory.amountUSDC = swappedUSDC;
        orderHistory.tradingReward = ZERO_BD;
        orderHistory.save();
    }

    // 更新交易人数
    updatePairTraderCount(event.transaction.from, event.params.buyer, pair as Pair, event);

    //更新DODOZoo
    let dodoZoo = getDODOZoo();
    dodoZoo.txCount = dodoZoo.txCount.plus(ONE_BI);
    dodoZoo.save();

    //更新报表数据
    let pairDayData = updatePairDayData(event);
    pairDayData.untrackedBaseVolume = pairDayData.untrackedBaseVolume.plus(untrackedBaseVolume);
    pairDayData.untrackedQuoteVolume = pairDayData.untrackedBaseVolume.plus(untrackedQuoteVolume);

    let baseDayData = updateTokenDayData(baseToken, event);
    baseDayData.untrackedVolume = baseDayData.untrackedVolume.plus(untrackedBaseVolume);

    let quoteDayData = updateTokenDayData(quoteToken, event);
    quoteDayData.untrackedVolume = baseDayData.untrackedVolume.plus(untrackedQuoteVolume);

    let fromTraderPair = PairTrader.load(event.transaction.from.toHexString().concat("-").concat(pair.id));
    if(fromTraderPair.lastTxTime.lt(BigInt.fromI32(pairDayData.date))){
        fromTraderPair.lastTxTime = event.block.timestamp;
        pairDayData.dailyTraders = pairDayData.dailyTraders.plus(ONE_BI);
        baseDayData.dailyTraders = baseDayData.dailyTraders.plus(ONE_BI);
        quoteDayData.dailyTraders = quoteDayData.dailyTraders.plus(ONE_BI);
    }
    fromTraderPair.save();

    let toTraderPair = PairTrader.load(event.params.buyer.toHexString().concat("-").concat(pair.id));
    if(toTraderPair.lastTxTime.lt(BigInt.fromI32(pairDayData.date))){
        toTraderPair.lastTxTime = event.block.timestamp;
        pairDayData.dailyTraders = pairDayData.dailyTraders.plus(ONE_BI);
        baseDayData.dailyTraders = baseDayData.dailyTraders.plus(ONE_BI);
        quoteDayData.dailyTraders = quoteDayData.dailyTraders.plus(ONE_BI);
    }
    toTraderPair.save();

    pairDayData.save();
    baseDayData.save();
    quoteDayData.save();
}
