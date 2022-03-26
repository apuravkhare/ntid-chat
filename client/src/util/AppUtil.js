import { toast } from 'react-toastify';
import AppConstants from '../AppConstants';

class AppUtil {
  createNotification(message, type) {
    switch (type) {
      case AppConstants.notificationType.info:
        toast.info(message);
        break;
      case AppConstants.notificationType.success:
        toast.success(message);
        break;
      case AppConstants.notificationType.warning:
        toast.warn(message);
        break;
      case AppConstants.notificationType.error:
        toast.error(message);
        break;
      default:
        toast(message);
        break;
    }
  }
}

export default new AppUtil();