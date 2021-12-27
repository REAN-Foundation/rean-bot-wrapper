export interface clientAuthenticator{
    authenticate (req, res);
    get headerToken();
    get urlToken();

}