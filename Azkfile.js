/**
 * Documentation: http://docs.azk.io/Azkfile.js
 */

// Adds the systems that shape your system
systems({
  'github-pivotal': {
    // Dependent systems
    depends: [],
    // More images:  http://images.azk.io
    image: {"docker": "azukiapp/node:0.12"},
    // Steps to execute before running instances
    provision: [
      "npm install",
    ],
    workdir: "/azk/#{manifest.dir}",
    shell: "/bin/bash",
    command: "npm development",
    wait: {"retry": 20, "timeout": 1000},
    mounts: {
      '/azk/#{manifest.dir}': path("."),
      '/azk/#{manifest.dir}/node_modules': persistent("#{system.name}-node_modules"),
    },
    scalable: {"default": 1},
    http: {
      domains: [ "#{system.name}.#{azk.default_domain}" ]
    },
    // port locked to facilitate test with ngrok
    // comment or remove to disable
    ports: {
      http: '8080:5000/tcp'
    },
    envs: {
      // set instances variables
      NODE_ENV: "dev",
      PATH: "/azk/#{manifest.dir}/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    },
    export_envs: {
      // exports variables for dependent systems
      APP_URL: "#{system.name}.#{azk.default_domain}:#{net.port.http}",
    },
  },
  // ngrok system
  ngrok: {
    // Dependent systems
    depends: [ "github-pivotal" ],
    // More images:  http://images.azk.io
    image: {"docker": "azukiapp/ngrok:latest"},
    wait: {"retry": 20, "timeout": 1000},
    http: {
      domains: [ "#{manifest.dir}-#{system.name}.#{azk.default_domain}" ],
    },
    ports: {
      // exports global variables
      http: "4040",
    },
    mounts: {
      '/ngrok/logs' : path("./logs"),
    },
    envs: {
      // set instances variables
      NGROK_CONFIG   : "/ngrok/ngrok.yml",
      NGROK_LOG      : "/ngrok/logs/ngrok.log",
      NGROK_SUBDOMAIN: "#{manifest.dir}",
    },
  },
});
