<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Luyện Thi PLĐC</title>
</svelte:head>

<div class="app-wrapper">
	<header class="main-header glass">
		<div class="container flex justify-between items-center">
			<a href="/" class="logo">
				<span class="logo-text">PLĐC Master</span>
			</a>
			<nav class="main-nav">
				<a href="/" class="nav-link">Trang chủ</a>
			</nav>
		</div>
	</header>

	<main class="main-content container">
		{@render children()}
	</main>
	
	<footer class="main-footer text-center text-muted">
		<p>© {new Date().getFullYear()} PLĐC Master. Chúc bạn ôn thi tốt!</p>
	</footer>
</div>

<style>
	.app-wrapper {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-header {
		position: sticky;
		top: 0;
		z-index: 50;
		padding: 1rem 0;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-main);
	}

	.logo-text {
		background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.main-nav {
		display: flex;
		gap: 1.5rem;
	}

	.nav-link {
		font-weight: 500;
		color: var(--text-muted);
		padding: 0.5rem 0;
		position: relative;
	}

	.nav-link:hover {
		color: var(--primary-color);
	}

	.nav-link::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 0%;
		height: 2px;
		background-color: var(--primary-color);
		transition: var(--transition);
	}

	.nav-link:hover::after {
		width: 100%;
	}

	.main-content {
		flex: 1;
		padding: 2rem 1rem;
	}

	.main-footer {
		padding: 2rem 0;
		font-size: 0.9rem;
	}
</style>
