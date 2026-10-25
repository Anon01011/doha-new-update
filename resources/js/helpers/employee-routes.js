/**
 * Employee URL helpers.
 *
 * Employee records are addressed by a readable slug
 * ("haider-shakeel-rajpoot-128") instead of the bare primary key. The slug is
 * stored on the employee row, so it travels with every payload the server
 * sends. Whenever a payload does not carry a slug (an older cached payload, or
 * a relation that only selected a few columns) the primary key is used as a
 * fallback, because the server still resolves it.
 *
 * The global `route()` helper is provided by the `@routes` Blade directive.
 */

/**
 * Resolve the route parameter used for an employee URL.
 *
 * @param {object|string|number|null|undefined} employee Employee payload from
 *        the server, or an already resolved route key.
 * @returns {string|number} The value to pass as the route parameter.
 */
export function employeeRouteKey(employee) {
    if (employee === null || employee === undefined) {
        return '';
    }

    if (typeof employee === 'string' || typeof employee === 'number') {
        return employee;
    }

    if (employee.slug) {
        return employee.slug;
    }

    return employee.id ?? '';
}

/**
 * Build an employee URL by route name.
 *
 * @param {string} name     Route name, e.g. "employees.show".
 * @param {object} employee Employee payload from the server.
 * @param {object} [params] Additional query string parameters.
 * @returns {string} The generated URL.
 */
export function employeeRoute(name, employee, params = {}) {
    return route(name, employeeRouteKey(employee), params);
}

/**
 * Build the canonical profile URL for an employee, using the slug when it is
 * available so the link is human readable and stable across sessions.
 *
 * @param {object} employee Employee payload from the server.
 * @returns {string} The generated URL.
 */
export function employeeProfileUrl(employee) {
    return employeeRoute('employees.show', employee);
}
