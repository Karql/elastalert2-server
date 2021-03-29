import indexHandler from '../handlers/';
import statusHandler from '../handlers/status';
import controlHandler from '../handlers/status/control';
import errorsHandler from '../handlers/status/errors';
import rulesHandler from '../handlers/rules';
import ruleGetHandler from '../handlers/rules/id/get';
import rulePostHandler from '../handlers/rules/id/post';
import ruleDeleteHandler from '../handlers/rules/id/delete';
import templatesHandler from '../handlers/templates';
import templateGetHandler from '../handlers/templates/id/get';
import templatePostHandler from '../handlers/templates/id/post';
import templateDeleteHandler from '../handlers/templates/id/delete';
import testPostHandler from '../handlers/test/post';
import metadataHandler from '../handlers/metadata/get';
import mappingHandler from '../handlers/mapping/get';
import searchHandler from '../handlers/search/get';
import { Route } from './route.model';


const routes: Route[] = [
  {
    path: '',
    method: 'get',
    handler: indexHandler
  }, {
    path: 'status',
    method: 'get',
    handler: statusHandler
  }, {
    path: 'status/control/:action',
    method: 'get',
    handler: controlHandler,
  }, {
    path: 'status/errors',
    method: 'get',
    handler: errorsHandler
  }, {
    path: 'rules',
    method: 'get',
    handler: rulesHandler
  }, {
    path: 'rules/:id',
    method: ['get', 'post', 'delete'],
    handler: [ruleGetHandler, rulePostHandler, ruleDeleteHandler]
  }, {
    path: 'templates',
    method: 'get',
    handler: templatesHandler
  }, {
    path: 'templates/:id',
    method: ['get', 'post', 'delete'],
    handler: [templateGetHandler, templatePostHandler, templateDeleteHandler]
  }, {
    path: 'test',
    method: 'post',
    handler: testPostHandler
  }, 
  {
    path: 'metadata/:type',
    method: ['get'],
    handler: [metadataHandler]
  },
  {
    path: 'mapping/:index',
    method: ['get'],
    handler: [mappingHandler]
  },
  {
    path: 'search/:index',
    method: ['post'],
    handler: [searchHandler]
  }
];

export default routes;
