describe('Orbita MERN Work Platform - Cypress E2E Test Suite', () => {
  beforeEach(() => {
    // Visit local Vite frontend URL
    cy.visit('/');
  });

  it('1. Landing Page Navigation Links & UI Structure', () => {
    cy.contains('ORBITA').should('be.visible');
    cy.contains('Runit Infotech').should('be.visible');
    cy.contains('Launch Workspace').should('be.visible');
    cy.contains('Sign In').should('be.visible');
  });

  it('2. Theme Switcher (Dark / Light Mode)', () => {
    // Click Sign In to view header theme toggle
    cy.contains('Sign In').click();
    cy.get('button[title*="Mode"]').first().click();
    cy.get('body').should('have.attr', 'data-theme');
  });

  it('3. Member Registration & Authentication Modal', () => {
    cy.contains('Sign In').click();
    cy.contains('Need an account? Register').click();
    
    const timestamp = Date.now();
    const testEmail = `cypress_user_${timestamp}@orbita.com`;
    
    cy.get('input[placeholder="John Doe"]').type('Cypress Test User');
    cy.get('input[placeholder="john@example.com"]').type(testEmail);
    cy.get('input[placeholder="••••••••"]').type('Password123!');
    
    cy.get('button[type="submit"]').contains('Create Account').click();
    cy.contains('Welcome to Orbita', { timeout: 10000 }).should('be.visible');
  });

  it('4. Superadmin Auth & Dedicated Command Center', () => {
    cy.contains('Sign In').click();
    cy.get('input[placeholder="john@example.com"]').type('superadmin@orbita.com');
    cy.get('input[placeholder="••••••••"]').type('superadmin123');
    cy.get('button[type="submit"]').contains('Sign In').click();
    
    cy.contains('Superadmin Command Center', { timeout: 10000 }).should('be.visible');
    cy.contains('User Governance').should('be.visible');
  });

  it('5. Executive Dashboard UI Links & Workspace Switcher', () => {
    cy.contains('Sign In').click();
    cy.get('input[placeholder="john@example.com"]').type('superadmin@orbita.com');
    cy.get('input[placeholder="••••••••"]').type('superadmin123');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Superadmin Command Center').should('be.visible');
  });

  it('6. New Item Creation Modal & Components', () => {
    // Login as standard member to view + New Item button
    cy.contains('Sign In').click();
    cy.get('input[placeholder="john@example.com"]').type('cypress_tester@orbita.com');
    cy.get('input[placeholder="••••••••"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.contains('+ New Item').click();
    cy.contains('Create Work Item').should('be.visible');
    cy.get('input[placeholder*="Title"]').type('Cypress Test Action Task');
    cy.get('select').first().select('Task');
    cy.contains('Save Item').click();
  });

  it('7. Routine Creation & Workflow Inspection', () => {
    cy.contains('Sign In').click();
    cy.get('input[placeholder="john@example.com"]').type('cypress_tester@orbita.com');
    cy.get('input[placeholder="••••••••"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.contains('+ New Item').click();
    cy.contains('Create Work Item').should('be.visible');
    cy.get('input[placeholder*="Title"]').type('Cypress Daily Recurring Routine');
    cy.get('select').first().select('Routine');
    
    // Select daily recurrence type if selector exists
    cy.contains('Save Item').click();
  });
});
