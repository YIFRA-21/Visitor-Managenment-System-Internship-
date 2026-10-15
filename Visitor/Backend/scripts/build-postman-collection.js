const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../ALL_API_ENDPOINTS.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const collection = {
  info: {
    _postman_id: 'vms-all-641-endpoints-2026',
    name: 'Visitor Management System (All 641 Endpoints)',
    description: 'Master collection containing all 641 endpoints across 40 modules with automatic Bearer token authentication.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    {
      key: 'baseUrl',
      value: 'http://localhost:5000',
      type: 'string'
    },
    {
      key: 'authToken',
      value: '',
      type: 'string'
    }
  ],
  auth: {
    type: 'bearer',
    bearer: [
      {
        key: 'token',
        value: '{{authToken}}',
        type: 'string'
      }
    ]
  },
  item: []
};

let totalEndpoints = 0;

for (const [moduleName, endpoints] of Object.entries(catalog)) {
  const folder = {
    name: `${moduleName} (${endpoints.length})`,
    item: []
  };

  endpoints.forEach((ep) => {
    totalEndpoints++;
    const cleanPath = ep.path.replace(':id', '1');
    const pathParts = cleanPath.replace(/^\//, '').split('/');
    const requestItem = {
      name: `${ep.method} ${cleanPath}`,
      request: {
        method: ep.method,
        header: [
          {
            key: 'Content-Type',
            value: 'application/json'
          }
        ],
        url: {
          raw: `{{baseUrl}}${cleanPath}`,
          host: ['{{baseUrl}}'],
          path: pathParts
        }
      }
    };

    // Specific sample bodies for Authentication endpoints
    if (ep.path === '/api/auth/login' && ep.method === 'POST') {
      requestItem.request.body = {
        mode: 'raw',
        raw: JSON.stringify({ email: 'belayyifra1@gmail.com', password: 'AdminPassword123!' }, null, 2)
      };
      requestItem.event = [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'const res = pm.response.json();',
              'const token = res.token || (res.data && res.data.token);',
              'if (token) {',
              '  pm.collectionVariables.set("authToken", token);',
              '  console.log("Saved authToken to collection variable:", token);',
              '}'
            ]
          }
        }
      ];
    } else if (ep.path === '/api/auth/check-email') {
      requestItem.request.body = {
        mode: 'raw',
        raw: JSON.stringify({ email: 'new_visitor_' + Math.floor(Math.random() * 9000 + 1000) + '@example.com' }, null, 2)
      };
    } else if (ep.path === '/api/auth/register') {
      requestItem.request.body = {
        mode: 'raw',
        raw: JSON.stringify({
          fullName: 'Abebe Kebede',
          email: 'abebe_' + Math.floor(Math.random() * 9000 + 1000) + '@example.com',
          password: 'Password123!',
          phone: '+251911223344',
          role: 'visitor'
        }, null, 2)
      };
    } else if (ep.path.includes('refresh')) {
      requestItem.request.body = {
        mode: 'raw',
        raw: JSON.stringify({ refreshToken: 'sample-refresh-token' }, null, 2)
      };
    } else if (ep.path.includes('forgot-password') || ep.path.includes('resend-verification')) {
      requestItem.request.body = {
        mode: 'raw',
        raw: JSON.stringify({ email: 'belayyifra1@gmail.com' }, null, 2)
      };
    } else if (ep.path.includes('reset-password') || ep.path.includes('verify-email')) {
      requestItem.request.body = {
        mode: 'raw',
        raw: JSON.stringify({ email: 'belayyifra1@gmail.com', token: '123456', newPassword: 'AdminPassword123!' }, null, 2)
      };
    } else if (ep.path.includes('change-password')) {
      requestItem.request.body = {
        mode: 'raw',
        raw: JSON.stringify({ currentPassword: 'AdminPassword123!', newPassword: 'NewAdminSecret123!' }, null, 2)
      };
    } else if (ep.path === '/api/auth/profile' && ep.method === 'PUT') {
      requestItem.request.body = {
        mode: 'raw',
        raw: JSON.stringify({ fullName: 'System Enterprise Administrator', phone: '+251921109998' }, null, 2)
      };
    } else if (ep.path.startsWith('/api/auth/users') && ep.method === 'PATCH') {
      requestItem.request.body = {
        mode: 'raw',
        raw: JSON.stringify({ status: 'ACTIVE' }, null, 2)
      };
    } else if (['POST', 'PUT', 'PATCH'].includes(ep.method)) {
      requestItem.request.body = {
        mode: 'raw',
        raw: '{\n  \n}'
      };
    }

    folder.item.push(requestItem);
  });

  collection.item.push(folder);
}

const outputPath = path.join(__dirname, '../VMS_ALL_641_ENDPOINTS_Postman_Collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf8');

console.log(`Success: Generated ${outputPath}`);
console.log(`Total Modules: ${collection.item.length}`);
console.log(`Total Endpoints: ${totalEndpoints}`);
