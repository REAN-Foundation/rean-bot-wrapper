import express from 'express';
import type { AuthenticationResult } from '../domain.types/auth/auth.domain.types.js';

export interface IAuthenticator {

    authenticateUser(
        request: express.Request,
        response: express.Response) : Promise<AuthenticationResult>;

    authenticateClient(
        request: express.Request,
        response: express.Response) : Promise<AuthenticationResult>;

}
