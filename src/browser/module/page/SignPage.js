import V from "../../../type/V.js";
import HttpClient from "../../../HttpClient.js";

export default class SignPage {

    async show(app, type) {
        const isSignIn = type === 'sign_in';
        const formName = isSignIn ? 'Sign in': 'Sign up';

        const pageSign = new V({class: 'pageSign'});
        e('>', [pageSign, app]);

        const signContainer = new V({class: 'signContainer'});
        e('>', [signContainer, pageSign]);

        const sign = new V({class: 'signBlock'});
        e('>', [sign, signContainer]);

        e('>', [new s.V({txt: formName}), sign]);
        e('>', [new s.V({tagName: 'br'}), sign]);

        e('>', [new s.V({name: 'Email'}), sign]);

        const email = new s.V({tagName: 'input', class: 'emailInput'});
        e('>', [email, sign]);

        e('>', [new s.V({name: 'Password'}), sign]);

        const password = new s.V({tagName: 'input', class: ['emailInput']});
        password.setAttr('type', 'password');
        e('>', [password, sign]);

        e('>', [new s.V({tagName: 'br'}), sign]); e('>', [new s.V({tagName: 'br'}), sign]);

        const btn = new V({tagName: 'button', txt: formName});
        e('>', [btn, sign]);


        let debounce = 0;

        const submit = async () => {
            if (debounce) return;
            debounce = 1;
            grecaptcha.ready(async () => {
                const recaptchaToken = await grecaptcha.execute('6Ldhj6AfAAAAAMjreOkJLkqN3zgejHQ2AQFA3m_e', {action: 'submit'})
                const data = {email: email.getValue(), password: password.getValue(), recaptchaToken};
                const res = await new HttpClient().post(document.location.pathname, data);
                debounce = 0;

                if (res.data.err) {
                    alert(res.data.err);
                } else {
                    document.location.href = '/';
                }
            });
        };
        const inputProcess = async (e) => e.key === 'Enter' ? submit() : null;

        email.on('keydown', (e) => inputProcess(e));
        password.on('keydown', (e) => inputProcess(e));
        btn.on('click', async (e) => submit());

        if (isSignIn) {
            const style = {marginLeft: '5px'};
            e('>', [new V({tagName: 'span', txt: "Don't have an account?", style}), sign]);
            e('>', [new V({tagName: 'a', txt: "Sign up"}).setAttr('href', '/sign/up'), sign]);
        }
    }
}