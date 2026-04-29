import Files from "../../models/Files";
import AppError from "../../errors/AppError";

const DeleteAllService = async (companyId: number | string): Promise<void> => {
  await Files.destroy({ where: { companyId } });
};

export default DeleteAllService;
