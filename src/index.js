/**
 * Routing Worker
 * 
 * Routes incoming requests to different workers based on rules.
 * Uses service bindings to call target workers.
 */

import routingConfig from '../routes.json';

export default {
  async fetch(request, env, ctx) {
    try {
      // Extract request information
      const url = new URL(request.url);
      const hostname = url.hostname;
      const pathname = url.pathname;
      
      console.log(`Routing request: ${hostname}${pathname}`);
      
      // Determine which worker to route to based on rules
      const targetWorker = getTargetWorker(hostname, pathname, env);
      
      if (!targetWorker) {
        return new Response('No matching route found', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // Forward the request to the target worker
      console.log(`Forwarding to: ${targetWorker.name}`);
      return await targetWorker.binding.fetch(request);
      
    } catch (error) {
      console.error('Routing error:', error);
      return new Response(`Routing error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};

/**
 * Determines which worker should handle the request based on routing rules
 * 
 * @param {string} hostname - The hostname from the request
 * @param {string} pathname - The pathname from the request
 * @param {object} env - Environment bindings including service bindings
 * @returns {object|null} Object with binding and name, or null if no match
 */
function getTargetWorker(hostname, pathname, env) {
  // Load routing rules from configuration
  const rules = routingConfig.rules;
  
  // Evaluate rules in order - first match wins
  for (const rule of rules) {
    if (matchesRule(rule, hostname, pathname)) {
      const workerBinding = env[rule.worker];
      
      if (!workerBinding) {
        console.error(`Worker binding not found: ${rule.worker}`);
        continue;
      }
      
      console.log(`Matched rule: ${rule.name}`);
      return {
        binding: workerBinding,
        name: rule.worker
      };
    }
  }
  
  return null;
}

/**
 * Checks if a request matches a routing rule
 * 
 * @param {object} rule - The routing rule from routes.json
 * @param {string} hostname - The request hostname
 * @param {string} pathname - The request pathname
 * @returns {boolean} True if the rule matches
 */
function matchesRule(rule, hostname, pathname) {
  // Default rule matches everything
  if (rule.default) {
    return true;
  }
  
  // Check hostname exact match
  if (rule.hostname && hostname !== rule.hostname) {
    return false;
  }
  
  // Check hostname ends with pattern
  if (rule.hostnameEndsWith && !hostname.endsWith(rule.hostnameEndsWith)) {
    return false;
  }
  
  // Check hostname starts with pattern
  if (rule.hostnameStartsWith && !hostname.startsWith(rule.hostnameStartsWith)) {
    return false;
  }
  
  // Check pathname starts with pattern
  if (rule.pathnameStartsWith && !pathname.startsWith(rule.pathnameStartsWith)) {
    return false;
  }
  
  // Check pathname ends with pattern
  if (rule.pathnameEndsWith && !pathname.endsWith(rule.pathnameEndsWith)) {
    return false;
  }
  
  // Check pathname exact match
  if (rule.pathname && pathname !== rule.pathname) {
    return false;
  }
  
  // All conditions passed
  return true;
}
