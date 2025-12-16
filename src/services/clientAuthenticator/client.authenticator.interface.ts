export interface clientAuthenticator{
    authenticate (req, res);
    headerToken();
    urlToken();

}