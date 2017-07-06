import * as React from 'react';
import styles from './InvitationManager.module.scss';
import { IInvitationManagerProps } from './IInvitationManagerProps';
import { IInvitationManagerState } from './IInvitationManagerState';
import { IInvitation } from './IInvitation';
import { escape } from '@microsoft/sp-lodash-subset';
import { HttpClient, IHttpClientOptions, HttpClientResponse } from '@microsoft/sp-http';
import * as AuthenticationContext from 'adal-angular';
import adalConfig from '../AdalConfig';
import { IAdalConfig } from '../../IAdalConfig';
import '../../WebPartAuthenticationContext';
import { PrimaryButton, IButtonProps, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

export default class InvitationManager extends React.Component<IInvitationManagerProps, IInvitationManagerState> {
  private authCtx: adal.AuthenticationContext;
  constructor(props: IInvitationManagerProps, context?: any) {
    super(props);

    this.state = {
      loading: false,
      error: null,
      invitation: null,
      signedIn: false,
      sendInvitationMessage: true,
      redirectUrl: '',
      emailAddress: '',
      displayName: '',
    };

    const config: IAdalConfig = adalConfig;
    config.popUp = true;
    config.webPartId = this.props.webPartId;
    config.callback = (error: any, token: string): void => {
      this.setState((previousState: IInvitationManagerState, currentProps: IInvitationManagerProps): IInvitationManagerState => {
        previousState.error = error;
        previousState.signedIn = !(!this.authCtx.getCachedUser());
        return previousState;
      });
    };

    this.authCtx = new AuthenticationContext(config);
    AuthenticationContext.prototype._singletonInstance = undefined;
  }

  public componentDidMount(): void {
    this.authCtx.handleWindowCallback();

    if (window !== window.top) {
      return;
    }

    this.setState((previousState: IInvitationManagerState, props: IInvitationManagerProps): IInvitationManagerState => {
      previousState.error = this.authCtx.getLoginError();
      previousState.signedIn = !(!this.authCtx.getCachedUser());
      return previousState;
    });
  }

  public componentDidUpdate(prevProps: IInvitationManagerProps, prevState: IInvitationManagerState, prevContext: any): void {
    if (prevState.signedIn !== this.state.signedIn) {
      //this._sendInvitation();
    }
  }

  public render(): React.ReactElement<IInvitationManagerProps> {
    const login: JSX.Element = this.state.signedIn ? <div /> : <button className={`${styles.button} ${styles.buttonCompound}`} onClick={() => { this.signIn(); } }><span className={styles.buttonLabel}>Sign in</span></button>;
    const loading: JSX.Element = this.state.loading ? <div style={{ margin: '0 auto', width: '7em' }}><div className={styles.spinner}><div className={`${styles.spinnerCircle} ${styles.spinnerNormal}`}></div><div className={styles.spinnerLabel}>Loading...</div></div></div> : <div/>;
    const error: JSX.Element = this.state.error ? <div><strong>Error: </strong> {this.state.error}</div> : <div/>;
    const invitedUserDisplayName: JSX.Element = this.state.invitation ? <div><strong>Display Name: </strong> {this.state.invitation.invitedUserDisplayName}</div> : <div/>;
    const invitedUserEmailAddress: JSX.Element = this.state.invitation ? <div><strong>Email Address: </strong> {this.state.invitation.invitedUserEmailAddress}</div> : <div/>;
    const status: JSX.Element = this.state.invitation ? <div><strong>Status: </strong> {this.state.invitation.status}</div> : <div/>;

    return (
      <div className={styles.invitationManager}>
        <div className={styles.container}>
          <div className={`ms-Grid-row ms-bgColor-themeDark ms-fontColor-white ${styles.row}`}>
            <div className="ms-Grid-col ms-u-lg10 ms-u-xl8 ms-u-xlPush2 ms-u-lgPush1">
              <span className="ms-font-xl ms-fontColor-white">Invitation Manager</span>
              <p className="ms-font-l ms-fontColor-white">Invite external user</p>
              <p className="ms-font-l ms-fontColor-white">{escape(this.props.title)}</p>
              <TextField onChanged={ this._displayName_onChanged } label='Display:' placeholder='Insert the display name of the external user' ariaLabel='Please enter text here' />
              <TextField onChanged={ this._eMail_onChanged } label='Email:' iconClass='ms-Icon--Mail ms-Icon' placeholder='Insert the email address of the external user' ariaLabel='Please enter text here' />
              <TextField onChanged={ this._redirectURL_onChanged } label='Redirect URL:' placeholder='Where do you want redirect the external user' ariaLabel='Please enter text here' />
              <Toggle
                    defaultChecked={ this.state.sendInvitationMessage }
                    label='Send invitation message'
                    onText='On'
                    offText='Off'
                    onChanged={ this._sendInvitationMessage_onChanged } />
              <div>
                {login}
                {loading}
                {error}
                {invitedUserDisplayName}
                {invitedUserEmailAddress}
                {status}
              </div>
              <DefaultButton
                data-automation-id='test'
                description='I am a description'
                onClick={() => { this._sendInvitation(); } } >
                  <span className={styles.buttonDescription}>Invite the user</span>
              </DefaultButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _sendInvitationMessage_onChanged(cheked: boolean): void {
    this.setState((previousState: IInvitationManagerState, currentProps: IInvitationManagerProps): IInvitationManagerState => {
        previousState.sendInvitationMessage = cheked;
        return previousState;
      });
  }

  @autobind
  private _redirectURL_onChanged(newValue: any): void {
    this.setState((previousState: IInvitationManagerState, currentProps: IInvitationManagerProps): IInvitationManagerState => {
        previousState.redirectUrl = newValue;
        return previousState;
      });
  }

  @autobind
  private _eMail_onChanged(newValue: any): void {
    this.setState((previousState: IInvitationManagerState, currentProps: IInvitationManagerProps): IInvitationManagerState => {
        previousState.emailAddress = newValue;
        return previousState;
      });
  }

  @autobind
  private _displayName_onChanged(newValue: any): void {
    this.setState((previousState: IInvitationManagerState, currentProps: IInvitationManagerProps): IInvitationManagerState => {
        previousState.displayName = newValue;
        return previousState;
      });
  }

  private _sendInvitation = (ev?:React.MouseEvent<HTMLButtonElement>) => {
    // Prevent postback
    ev ? ev.preventDefault() : null;

    if (this.state.signedIn !== false) {
      this.sendInvitation();
    }
  }

  public signIn(): void {
    this.authCtx.login();
  }

  private sendInvitation(): void {
    this.setState((previousState: IInvitationManagerState, props: IInvitationManagerProps): IInvitationManagerState => {
      previousState.loading = true;
      return previousState;
    });

    this.getGraphAccessToken()
      .then((accessToken: string): Promise<IInvitation> => {
        console.log(accessToken);
        return InvitationManager.postInvitation(accessToken, this.props.httpClient, this.state);
      })
      .then((invitation: IInvitation): void => {
        this.setState((prevState: IInvitationManagerState, props: IInvitationManagerProps): IInvitationManagerState => {
          prevState.loading = false;
          prevState.invitation = invitation;
          return prevState;
        });
      }, (error: any): void => {
        this.setState((prevState: IInvitationManagerState, props: IInvitationManagerProps): IInvitationManagerState => {
          prevState.loading = false;
          prevState.error = error;
          return prevState;
        });
      });
  }

  private getGraphAccessToken(): Promise<string> {
    return new Promise<string>((resolve: (accessToken: string) => void, reject: (error: any) => void): void => {
      const graphResource: string = 'https://graph.microsoft.com';
      const accessToken: string = this.authCtx.getCachedToken(graphResource);
      if (accessToken) {
        console.log('ACCESS TOKEN: ' + accessToken);        
        resolve(accessToken);
        return;
      }

      if (this.authCtx.loginInProgress()) {
        reject('Login already in progress');
        return;
      }

      this.authCtx.acquireToken(graphResource, (error: string, token: string) => {
        if (error) {
          reject(error);
          return;
        }

        if (token) {
          resolve(token);
        }
        else {
          reject('Couldn\'t retrieve access token');
        }
      });
    });
  }

  private static postInvitation(accessToken: string, httpClient: HttpClient, previousState: IInvitationManagerState): Promise<IInvitation> {
    const postURL = `https://graph.microsoft.com/v1.0/invitations`; 
    debugger;
    const body: string = JSON.stringify({
          'invitedUserDisplayName': previousState.displayName,
          'invitedUserEmailAddress': previousState.emailAddress,
          'inviteRedirectUrl': previousState.redirectUrl,
          "sendInvitationMessage": previousState.sendInvitationMessage,
        });
    const requestHeaders: Headers = new Headers(); 
    requestHeaders.append('Content-type', 'application/json'); 
    requestHeaders.append('Cache-Control', 'no-cache'); 
    //For an OAuth token 
    requestHeaders.append('Authorization', 'Bearer ' + accessToken); 
    //For Basic authentication requestHeaders.append('Authorization', 'Basic <CREDENTIALS>');
    
    const httpClientOptions: IHttpClientOptions = { body: body, headers: requestHeaders };

    return new Promise<IInvitation>((resolve: (invitation: IInvitation) => void, reject: (error: any) => void): void => {
      httpClient.post(postURL, HttpClient.configurations.v1, httpClientOptions)
        .then((response: HttpClientResponse): Promise<IInvitation> => {
          return response.json();
        })
        .then((invitationResponse: IInvitation ): void => {
          const invitation: IInvitation = {
            id: '',
            inviteRedeemUrl: '',
            invitedUserDisplayName: '',
            invitedUserEmailAddress: '',
            sendInvitationMessage: '',
            inviteRedirectUrl: '',
            status: ''
          };
          invitation.id = invitationResponse.id;
          invitation.invitedUserDisplayName = invitationResponse.invitedUserDisplayName;
          invitation.invitedUserEmailAddress = invitationResponse.invitedUserEmailAddress;
          invitation.inviteRedeemUrl = invitationResponse.inviteRedeemUrl;
          invitation.inviteRedirectUrl = invitationResponse.inviteRedirectUrl;
          invitation.sendInvitationMessage = invitationResponse.sendInvitationMessage;
          invitation.status = invitationResponse.status;
          
          resolve(invitation);
        }, (error: any): void => {
          reject(error);
        });
    });
  }

}
