import * as path from "path";
import * as sgMail from "@sendgrid/mail";
import * as ejs from "ejs";
import { log } from "./../libraries/Log";
import { config } from "./../config/config";
import i18n from "./../libraries/i18n";

class EmailService {
  constructor() {
    sgMail.setApiKey(config.email.auth.api_key);
  }

  private compileTemplate(context: any): Promise<string> {
    return new Promise((resolve, reject) => {
      ejs.renderFile(
        path.join(__dirname, "../views/email/template.ejs"),
        context,
        (err, str) => {
          if (err) return reject(err);
          return resolve(str);
        },
      );
    });
  }

  sendEmail(
    email: string,
    subject: string,
    page: string,
    locale: string,
    context?: any,
  ): Promise<any> {
    if (context == null) context = {};
    context.page = page;

    const t: any = {};
    i18n.init(t);
    if (locale == null) locale = "en";
    t.setLocale(locale);

    context.__ = t.__;

    // Translate subject
    subject = t.__(subject);

    return this.compileTemplate(context).then((html: string) => {
      log.debug(`Sending ${page} email to: ${email}`);
      const msg = {
        to: email,
        from: config.email.from_address,
        subject,
        html: html,
      };
      return sgMail.send(msg).then(
        () => {
          msg;
        },
        (error) => {
          console.error(error);
          if (error.response) {
            console.error(error.response.body);
          }
        },
      );
    });
  }
}

const emailService = new EmailService();
export default emailService;
