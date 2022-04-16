import { toast } from 'react-toastify';
import AppConstants from '../AppConstants';
import { parse } from 'querystring';

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

  getQueryParams(props) {
    const parsed = parse(props.location.search.replace("?", ""));
    parsed.video = (parsed.video === "true");
    parsed.showCaptions = (parsed.captions === "true");
    parsed.identifySpeakers = (parsed.idSpeaker === "true");
    parsed.generateCaptions = (parsed.genCaptions === "true");
    parsed.messageEditType = parsed.edit;
    parsed.admin = (parsed.admin === "true");
    return [props.match.params.roomID, parsed];
  }
}

export default new AppUtil();