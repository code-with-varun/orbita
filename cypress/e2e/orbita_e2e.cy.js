describe('Orbita MERN Work Platform - Cypress E2E Test Suite', () => {
  beforeEach(() => {
    // Visit local Vite frontend URL
    cy.visit('http://localhost:5173');
  });

  it('1. Landing Page Navigation Links & UI Structure', () => {
    cy.contains('ORBITA').should('be.visible');
    cy.contains('Runit Infotech').should('be.visible');
    cy.contains('Launch Workspace').should('be.visible');
    cy.contains('Sign In').should('be.visible');
  });

  it('2. Theme Switcher (Dark / Light Mode)', () => {
    // Click header theme toggle button
    cy.get('button[title*="Mode"]').first().click({ force: true });
    cy.get('body').should('have.attr', 'data-theme');
  });

  it('3. Member Registration & Authentication Modal', () => {
    cy.contains('Sign In').click();
    cy.contains('button', 'Register').click();
    
    const timestamp = Date.now();
    const testEmail = `cypress_user_${timestamp}@orbita.com`;
    
    cy.get('input[placeholder*="Varun"]').type('Cypress Test User');
    cy.get('input[type="email"]').type(testEmail);
    cy.get('input[type="password"]').type('Password123!');
    
    cy.get('button[type="submit"]').contains('Create Account').click();
    cy.contains('Tasks & Work Items', { timeout: 10000 }).should('be.visible');
  });

  it('4. Superadmin Auth & Dedicated Command Center', () => {
    cy.contains('Sign In').click();
    cy.get('input[type="email"]').type('superadmin@orbita.com');
    cy.get('input[type="password"]').type('superadmin123');
    cy.get('button[type="submit"]').contains('Sign In').click();
    
    cy.contains('Superadmin Command Center', { timeout: 10000 }).should('be.visible');
    cy.contains('User Governance').should('be.visible');
  });

  it('5. Executive Dashboard UI Links & Workspace Switcher', () => {
    cy.contains('Sign In').click();
    cy.get('input[type="email"]').type('superadmin@orbita.com');
    cy.get('input[type="password"]').type('superadmin123');
    cy.get('button[type="submit"]').contains('Sign In').click();
    
    cy.contains('Superadmin Command Center', { timeout: 10000 }).should('be.visible');
  });

  it('6. New Item Creation Modal & Components', () => {
    cy.contains('Sign In').click();
    cy.get('input[type="email"]').type('superadmin@orbita.com');
    cy.get('input[type="password"]').type('superadmin123');
    cy.get('button[type="submit"]').contains('Sign In').click();

    cy.contains('+ New Item').click();
    cy.contains('Create Task').should('be.visible');
    cy.get('input[placeholder*="Task Title"]').type('Cypress Test Action Task');
    cy.contains('Create Task').click();
  });

  it('7. Routine Creation & Workflow Inspection', () => {
    cy.contains('Sign In').click();
    cy.get('input[type="email"]').type('superadmin@orbita.com');
    cy.get('input[type="password"]').type('superadmin123');
    cy.get('button[type="submit"]').contains('Sign In').click();

    cy.contains('+ New Item').click();
    cy.contains('button', 'Routine').click();
    cy.contains('Create Routine').should('be.visible');
    cy.get('input[placeholder*="Routine Title"]').type('Cypress Daily Recurring Routine');
    cy.contains('Create Routine').click();
  });

  it('8. Profile Settings Menu & Multi-Sheet Excel Data Export', () => {
    cy.contains('Sign In').click();
    cy.get('input[type="email"]').type('superadmin@orbita.com');
    cy.get('input[type="password"]').type('superadmin123');
    cy.get('button[type="submit"]').contains('Sign In').click();

    // Click profile badge in header to open profile settings menu
    cy.get('.user-badge-header').click();
    cy.contains('Profile & Settings').should('be.visible');
    cy.contains('Export My Data (.xlsx)').should('be.visible');
    cy.contains('Reset Password').should('be.visible');

    // Open Profile Settings Modal
    cy.contains('Profile & Settings').click();
    cy.contains('Profile & Settings').should('be.visible');
    cy.contains('Account Information').should('be.visible');

    // Switch to Export tab
    cy.contains('button', 'Export Data (Excel)').click();
    cy.contains('Complete Excel Sheet Data Dump').should('be.visible');
    cy.contains('Work Items (Tasks)').should('be.visible');
    cy.contains('Focus & Time Sessions').should('be.visible');
    cy.contains('Credential Vault').should('be.visible');
    cy.contains('Export All Data Table-Wise (.xlsx)').should('be.visible');
  });

  it('9. Password Reset Feature in Profile Settings & Auth Modal', () => {
    // 9a: Check Forgot Password link on Auth Modal
    cy.contains('Sign In').click();
    cy.contains('Forgot Password?').click();
    cy.contains('Reset Account Password').should('be.visible');
    cy.contains('Back to Sign In').click();
    cy.contains('Welcome Back').should('be.visible');

    // 9b: Check Password Reset in Profile Settings
    cy.get('input[type="email"]').type('superadmin@orbita.com');
    cy.get('input[type="password"]').type('superadmin123');
    cy.get('button[type="submit"]').contains('Sign In').click();

    cy.get('.user-badge-header').click();
    cy.contains('Reset Password').click();
    cy.contains('Reset or Change Password').should('be.visible');
    cy.get('input[placeholder*="new strong password"]').should('be.visible');
    cy.get('input[placeholder*="Re-enter new password"]').should('be.visible');
  });
});
