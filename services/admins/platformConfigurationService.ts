import {IPlatformConfiguration, PlatformConfiguration} from "../../models/platformConfiguration";
import {getUpdateOptions} from "../../utils/utils";

export class PlatformConfigurationService {

    public async updatePlatformConfigurations(body: IPlatformConfiguration): Promise<IPlatformConfiguration> {
        await PlatformConfiguration.findOneAndUpdate({}, body).exec();
        return await PlatformConfigurationService.getPlatformConfigurations();
    }

    public async getPlatformConfiguration(): Promise<IPlatformConfiguration> {
        return await PlatformConfigurationService.getPlatformConfigurations();
    }

    public static async getPlatformConfigurations(): Promise<IPlatformConfiguration> {
        return await PlatformConfiguration.findOne()
            .lean<IPlatformConfiguration>()
            .exec();
    }

    public static ensurePlatformConfigurations() {
        new Promise(async (resolve) => {
            await PlatformConfiguration.findOneAndUpdate({}, {}, getUpdateOptions());
            resolve(null);
        }).catch(err => {
            console.error('Error ensuring platform configuration', err);
            process.exit(1);
        })
    }

}
