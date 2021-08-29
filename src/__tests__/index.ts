import {
  buildClientObjectFromFolderStructures,
  extractRouteInterfaces,
  getRouteFolders,
  getRouteName,
  getRoutePath,
} from '../helpers';

describe('index', () => {
  describe('getRouteName', () => {
    it('Should return CreateEnrichments', () => {
      expect(getRouteName('waalaxy/back/services/enutrof/src/routes/private/Enrichments/CreateEnrichment')).toEqual(
        'CreateEnrichment',
      );
    });
  });
  describe('getRouteFolders', () => {
    it('Should return folder structure', () => {
      expect(getRouteFolders('waalaxy/back/services/enutrof/src/routes/private/Enrichments/CreateEnrichment')).toEqual([
        'private',
        'Enrichments',
        'CreateEnrichment',
      ]);
    });
  });
  describe('getRoutePath', () => {
    it('Should return folder structure', () => {
      expect(
        getRoutePath(
          'waalaxy/back/services/enutrof/src/routes/private/Enrichments/CreateEnrichment/CreateEnrichment.route.ts',
        ),
      ).toEqual('waalaxy/back/services/enutrof/src/routes/private/Enrichments/CreateEnrichment');
    });
  });
  describe('getClientObjectFromFolderStructures', () => {
    it('Should return folder structure object', async () => {
      expect(
        await buildClientObjectFromFolderStructures(
          [
            { folders: 'private/Enrichments/CreateEnrichment'.split('/'), data: 0 },
            { folders: 'private/Enrichments/GetEnrichments'.split('/'), data: 0 },
            { folders: 'private/Enrichments/GetEnrichment'.split('/'), data: 0 },
            { folders: 'private/Enrichments/UpdateEnrichment'.split('/'), data: 0 },
            { folders: 'private/Enrichments/DeleteEnrichment'.split('/'), data: 0 },
            { folders: 'private/Quotas/GetQuotas'.split('/'), data: 0 },
            { folders: 'private/Quotas/LockQuotas/Access'.split('/'), data: 0 },
            { folders: 'private/Quotas/LockQuotas/UnLock'.split('/'), data: 0 },
            { folders: 'private/Quotas/DeleteQuotas'.split('/'), data: 0 },
            { folders: 'public/Auth/Login'.split('/'), data: 0 },
            { folders: 'public/Auth/Change/Password'.split('/'), data: 0 },
            { folders: 'public/WebClient/Get'.split('/'), data: 0 },
          ],
          async () => 'function',
        ),
      ).toEqual({
        private: {
          enrichments: {
            createEnrichment: 'function',
            getEnrichments: 'function',
            getEnrichment: 'function',
            updateEnrichment: 'function',
            deleteEnrichment: 'function',
          },
          quotas: {
            getQuotas: 'function',
            lockQuotas: {
              access: 'function',
              unLock: 'function',
            },
            deleteQuotas: 'function',
          },
        },
        public: {
          auth: {
            login: 'function',
            change: {
              password: 'function',
            },
          },
          webClient: {
            get: 'function',
          },
        },
      });
    });
  });
  describe('extractRouteInterfaces', () => {
    const tests = [
      {
        data: `
              /* eslint-disable camelcase */
              // eslint-disable-next-line import/no-unresolved
              
              import { DropContactParams } from '../../../../services/dropcontact/interfaces';
              
              export type CreateEnrichmentBody = DropContactParams & {
                  prospect: string;
              };
              
              export interface CreateEnrichmentResponse200 {
                  dataToEnrich: {
                      email?: string;
                      first_name?: string;
                      last_name?: string;
                      full_name?: string;
                      phone?: string;
                      company?: string;
                      website?: string;
                      num_siren?: string;
                  };
                  prospect: string;
                  status: string;
                  requestId?: string;
                  enrichementResult?: {
                      civility?: string;
                      first_name?: string;
                      last_name?: string;
                      full_name?: string;
                      email?: Array<{ email?: string; qualification?: string }>;
                      phone?: string;
                      mobile_phone?: string;
                      company?: string;
                      website?: string;
                      linkedin?: string;
                      company_infogreffe?: string;
                      siren?: string;
                      siret?: string;
                      vat?: string;
                      nb_employees?: string;
                      naf5_code?: string;
                      naf5_des?: string;
                      siret_address?: string;
                      siret_zip?: string;
                      siret_city?: string;
                      company_linkedin?: string;
                      company_turnover?: string;
                      company_results?: string;
                  };
              }
              `,
        result: {
          bodyInterface: 'CreateEnrichmentBody',
          responsesInterfaces: ['CreateEnrichmentResponse200'],
        },
      },
      {
        data: `import { ITraveler } from '@/entities/Traveler';
          // eslint-disable-next-line import/no-unresolved
          import * as core from 'express-serve-static-core';
          
          export interface GetTravelersQuery {
              start?: string;
              count?: string;
          }
          
          export interface GetTravelersPath extends core.ParamsDictionary {
              campaignId: string;
          }
          
          export interface GetTravelersResponse200 {
              total: number;
              travelers: Array<ITraveler>;
          }
          `,
        result: {
          pathInterface: 'GetTravelersPath',
          queryInterface: 'GetTravelersQuery',
          responsesInterfaces: ['GetTravelersResponse200'],
        },
      },
      {
        data: `import { ITraveler } from '@/entities/Traveler';
          // eslint-disable-next-line import/no-unresolved
          import * as core from 'express-serve-static-core';
          
          export interface GetTravelersQuery {
              start?: string;
              count?: string;
          }
          
          export interface GetTravelersPath extends core.ParamsDictionary {
              campaignId: string;
          }
          
          export interface GetTravelersBody {
            campaignId: string;
        }

          export interface GetTravelersResponse200 {
              total: number;
              travelers: Array<ITraveler>;
          }

          export interface GetTravelersResponse201 {
            total: number;
            travelers: Array<ITraveler>;
        }

        export interface GetTravelersResponse400 {
            total: number;
            travelers: Array<ITraveler>;
        }
          `,
        result: {
          bodyInterface: 'GetTravelersBody',
          pathInterface: 'GetTravelersPath',
          queryInterface: 'GetTravelersQuery',
          responsesInterfaces: ['GetTravelersResponse200', 'GetTravelersResponse201', 'GetTravelersResponse400'],
        },
      },
    ];
    tests.forEach(({ data, result }) => {
      it('Should return interfaces', () => {
        expect(extractRouteInterfaces(data)).toEqual(result);
      });
    });
  });
});
