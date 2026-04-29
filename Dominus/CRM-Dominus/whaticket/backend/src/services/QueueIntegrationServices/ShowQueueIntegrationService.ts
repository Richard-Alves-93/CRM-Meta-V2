import QueueIntegrations from "../../models/QueueIntegrations";
import AppError from "../../errors/AppError";


const ShowQueueIntegrationService = async (id: string | number, companyId: number | string): Promise<QueueIntegrations> => {
  const integration = await QueueIntegrations.findByPk(id);

  if (integration && String(integration.companyId) !== String(companyId)) {
    throw new AppError("Não é possível acessar registro de outra empresa");
  }

  if (!integration) {
    throw new AppError("ERR_NO_DIALOG_FOUND", 404);
  }

  return integration;
};

export default ShowQueueIntegrationService;