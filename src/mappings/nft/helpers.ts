import {InitializableERC721} from "../../types/nft/templates/NFTTokenFactory/InitializableERC721"
import {InitializableERC1155} from "../../types/nft/templates/NFTTokenFactory/InitializableERC1155"
import {Nft, Fragment, User} from "../../types/nft/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {Fragment as FragmentContract} from "../../types/nft/templates/Fragment/Fragment"

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

function fetchNFTName(address: Address): String {
    let name = null;
    let erc721Contract = InitializableERC721.bind(address);
    let erc721name = erc721Contract.try_name();
    if (erc721name.reverted != true) {
        name = erc721name.value;
    }
    return name;
}

export function createAndGetNFT(address: Address): Nft {
    let nft = Nft.load(address.toHexString());
    if (nft == null) {
        nft = new Nft(address.toHexString());
        nft.save()
    }
    return nft as Nft;
}

export function createAndGetFragment(address: Address): Fragment {
    let fragmentContract = FragmentContract.bind(address);
    let fragment = Fragment.load(address.toHexString());
    if (fragment == null) {
        fragment = new Fragment(address.toHexString());
        fragment.isBuyOut = fragmentContract._IS_BUYOUT_();
        fragment.buyoutTimestamp = fragmentContract._BUYOUT_TIMESTAMP_();
        fragment.decimals = fragmentContract.decimals();
        fragment.dvm = fragmentContract._DVM_().toHexString();
        fragment.initialized = fragmentContract.initialized();
        fragment.name = fragmentContract.name();
        fragment.symbol = fragmentContract.symbol();
        fragment.quote = fragmentContract._QUOTE_().toHexString();
        fragment.totalSupply = fragmentContract.totalSupply();
        fragment.vaultPreOwner = fragmentContract._VAULT_PRE_OWNER_().toHexString();
    }
    return fragment as Fragment;
}

export function createUser(address: Address): User {
    let user = User.load(address.toHexString());
    if (user == null) {
        user = new User(address.toHexString());
        user.save();
    }
    return user as User;
}