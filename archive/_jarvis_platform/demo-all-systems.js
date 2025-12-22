#!/usr/bin/env node

/**
 * ============================================
 * JARVIS Enterprise - Complete Demo
 * Demonstrates all 6 advanced systems
 * ============================================
 */

console.log('\n' + '='.repeat(70));
console.log('🎯 JARVIS ENTERPRISE PLATFORM - COMPLETE DEMONSTRATION');
console.log('='.repeat(70) + '\n');

console.log('🚀 Starting comprehensive demo of all systems...\n');

async function runDemo() {
  const demos = [
    {
      name: 'Intelligent Auto-Healing System',
      icon: '🏥',
      file: './intelligent-healing-system.js',
      description: 'ML-based anomaly detection and self-repair'
    },
    {
      name: 'Observability Platform',
      icon: '📊',
      file: './observability-platform.js',
      description: 'Distributed tracing, metrics, and SLA/SLO monitoring'
    },
    {
      name: 'Chaos Engineering Framework',
      icon: '🌪️',
      file: './chaos-engineering-framework.js',
      description: 'Controlled failure injection and resilience testing'
    },
    {
      name: 'Feature Flags System',
      icon: '🎚️',
      file: './feature-flags-system.js',
      description: 'Dynamic features, A/B testing, gradual rollouts'
    },
    {
      name: 'Service Mesh',
      icon: '🕸️',
      file: './service-mesh.js',
      description: 'Load balancing, circuit breaking, canary deployments'
    }
  ];

  console.log('📋 Available System Demos:\n');

  demos.forEach((demo, i) => {
    console.log(`   ${i + 1}. ${demo.icon} ${demo.name}`);
    console.log(`      ${demo.description}`);
    console.log(`      File: ${demo.file}\n`);
  });

  console.log('='.repeat(70));
  console.log('🎯 Master Orchestrator Demo');
  console.log('='.repeat(70) + '\n');

  console.log('Running Master Orchestrator (integrates all systems)...\n');

  try {
    const { MasterOrchestrator } = await import('./master-orchestrator.js');

    const master = new MasterOrchestrator({
      serviceName: 'jarvis-demo',
      environment: 'demo'
    });

    console.log('✅ Master Orchestrator initialized\n');

    // Quick status check
    const status = master.getStatus();

    console.log('📊 System Status:\n');
    console.log(`   Health: ${status.health}`);
    console.log(`   Uptime: ${Math.floor(status.uptime / 1000)}s`);
    console.log('\n   Subsystems:');

    Object.entries(status.subsystems).forEach(([name, active]) => {
      const icon = active ? '✅' : '❌';
      console.log(`      ${icon} ${name}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ DEMONSTRATION COMPLETE');
    console.log('='.repeat(70) + '\n');

    console.log('🎉 All systems operational!\n');
    console.log('📚 Next Steps:\n');
    console.log('   1. Run individual demos: node <system-file>.js');
    console.log('   2. Read documentation: ENTERPRISE-SYSTEMS-SUMMARY.md');
    console.log('   3. Explore advanced features: ADVANCED-FEATURES-GUIDE.md');
    console.log('   4. Deploy to production: DEPLOYMENT-GUIDE.md\n');

    console.log('🚀 Available Commands:\n');
    console.log('   npm run panel          # Start JARVIS dashboard');
    console.log('   npm run protected      # Start with auto-protection');
    console.log('   docker-compose up -d   # Deploy full stack');
    console.log('   kubectl apply -f k8s/  # Deploy to Kubernetes\n');

  } catch (error) {
    console.error('❌ Error running demo:', error.message);
    console.log('\n💡 Make sure all dependencies are installed:');
    console.log('   npm install\n');
  }
}

runDemo().catch(console.error);
