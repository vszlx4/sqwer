<script lang="ts">
	import FingerAssessment from '#lib/assessment/FingerAssessment.svelte';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';
</script>

<Seo title="Finger speed assessment" description="Measure the speed and accuracy of each finger using your own finger map." />
<Breadcrumbs items={[{ href: '/exams', label: 'Practice' }, { href: '/exams/finger-speed', label: 'Finger speed assessment' }]} />
<FingerAssessment />
