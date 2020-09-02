import {IWallet} from "../../models/wallet";
import {WalletService} from "../shared/walletService";
import {DeliveryService} from "./deliveryService";
import {IUser} from "../../models/user";
import {AccountService} from "../shared/accountService";

export class HomeService {

    public async loadHome(userId: string): Promise<{user: IUser, wallet: IWallet, activeDeliveriesCount: number}> {
        const user: IUser = await new AccountService().getAccount(userId);
        const wallet: IWallet = await new WalletService().getWallet(userId);
        const activeDeliveriesCount = await new DeliveryService().getActiveDeliveriesCount(userId);
        return {user, wallet, activeDeliveriesCount};
    }

}
