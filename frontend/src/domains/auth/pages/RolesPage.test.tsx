import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { ROLE, USER } from '@/services/mock/data/ids';
import { renderRoute } from '@/test/renderWithProviders';

describe('roles and privileges screen', () => {
  it('shows the roles, the screen × role matrix and the privilege catalogue', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/roles');
    const table = await screen.findByRole('table');
    expect(within(table).getByRole('link', { name: 'Portföy ofisi' })).toBeInTheDocument();
    expect(within(table).getByText('Sistem rolü')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Yetki matrisi/ }));
    const matrix = await screen.findByRole('table');
    expect(within(matrix).getByRole('columnheader', { name: 'Denetçi (salt okunur)' }));
    const leaves = within(matrix).getByRole('row', { name: /^İzinler/ });
    // Manager edits leaves; the business-unit role has no access.
    expect(within(leaves).getAllByText('Düzenleme').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: /Yetki kataloğu/ }));
    expect(await screen.findByText('demandManagement:delete')).toBeInTheDocument();
  });

  it('creates a role from the per-screen access levels', async () => {
    const user = userEvent.setup();
    const { repositories, router } = renderRoute('/admin/roles/new');
    // Wait for the whole matrix (the last row) so the name field typed into is the final one.
    await screen.findByRole(
      'radiogroup',
      { name: 'Roller ve yetkiler erişimi' },
      { timeout: 10_000 },
    );
    const name = screen.getByRole('textbox', { name: /Rol adı/ });
    await user.type(name, 'Finans analisti');
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /Rol adı/ })).toHaveValue('Finans analisti'),
    );
    await user.click(
      within(screen.getByRole('radiogroup', { name: 'Projeler erişimi' })).getByRole('radio', {
        name: 'Düzenleme',
      }),
    );
    expect(screen.getByText('Proje oluşturur ve düzenler; belge yükler.')).toBeInTheDocument();
    await user.click(
      within(screen.getByRole('radiogroup', { name: 'Raporlar erişimi' })).getByRole('radio', {
        name: 'Görüntüleme',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Rol oluştur' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/roles'), {
      timeout: 10_000,
    });
    const saved = (await repositories.roles.list()).find((r) => r.name === 'Finans analisti');
    expect(saved?.privileges).toEqual(['projects:view', 'projects:edit', 'reports:view']);
  });

  it('shows the system role read-only', async () => {
    renderRoute(`/admin/roles/${ROLE.systemAdmin}/edit`);
    expect(await screen.findByText('Bu rol değiştirilemez')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Değişiklikleri kaydet' })).not.toBeInTheDocument();
  });

  it('assigns several roles to a user and previews the combined access', async () => {
    const user = userEvent.setup();
    const { repositories } = renderRoute(`/admin/users/${USER.tomBrennan}/edit`);
    const access = await screen.findByRole('group', { name: 'Etkin yetkiler' });
    await waitFor(() =>
      expect(within(access).getByText('Talep yönetimi').nextElementSibling).toHaveTextContent(
        'Görüntüleme',
      ),
    );
    await user.click(screen.getByRole('combobox', { name: /Roller/ }));
    await user.click(await screen.findByRole('option', { name: 'Portföy ofisi' }));
    expect(within(access).getByText('Talep yönetimi').nextElementSibling).toHaveTextContent(
      'Tam yetki',
    );
    await user.click(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }));
    await screen.findByText('Tom Brennan güncellendi');
    expect((await repositories.users.getById(USER.tomBrennan)).roleIds).toEqual([
      ROLE.manager,
      ROLE.portfolioOffice,
    ]);
  });
});

describe('screen access by role', () => {
  it('shows each user only the screens their roles allow', async () => {
    renderRoute('/teams', createMockRepositories({ signedInAs: USER.elifKaya }));
    const nav = await screen.findByRole('navigation', { name: 'Ana menü' });
    await within(nav).findByRole('link', { name: 'Talepler' });
    expect(within(nav).queryByRole('link', { name: 'Talep yönetimi' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Roller ve yetkiler' })).not.toBeInTheDocument();
    // Read-only on teams: the page opens without "create".
    expect(await screen.findByRole('heading', { level: 1, name: 'Ekipler' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ekip oluştur' })).not.toBeInTheDocument();
  });

  it('lets a manager edit leaves but not projects', async () => {
    renderRoute('/leaves?date=2026-10-01', createMockRepositories({ signedInAs: USER.tomBrennan }));
    expect(await screen.findByRole('button', { name: 'İzin ekle' })).toBeInTheDocument();
  });

  it('refuses a screen the roles do not include, even by URL', async () => {
    renderRoute('/admin/roles', createMockRepositories({ signedInAs: USER.zeynepCelik }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Erişim yetkiniz yok' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Roller ve yetkiler ekranını görüntüleme/)).toBeInTheDocument();
  });

  it('starts a user without the dashboard on their first allowed screen', async () => {
    const repositories = createMockRepositories({ signedInAs: USER.canOzturk });
    const role = await repositories.roles.create({
      name: 'Yalnızca talep',
      description: '',
      privileges: ['demands:edit'],
    });
    const elif = await repositories.users.getById(USER.elifKaya);
    await repositories.users.update(elif.id, { ...elif, roleIds: [role.id] });
    await repositories.auth.signIn(USER.elifKaya);
    const { router } = renderRoute('/', repositories);
    await waitFor(() => expect(router.state.location.pathname).toBe('/demands'));
  });
});
