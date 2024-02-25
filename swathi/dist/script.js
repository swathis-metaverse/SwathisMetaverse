const animeTitle = (element) => {
		const arrayText = element.innerHTML.split("");
		element.innerHTML = "";
		arrayText.forEach((letter, indice) => {
			setTimeout(() => (element.innerHTML += letter), 135 * indice);
		});
		element.classList.add("animate__shakeY");
	};

	const h1 = document.querySelector("h1.title");

	animeTitle(h1);

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			entry.isIntersecting
				? entry.target.classList.add("show")
				: entry.target.classList.remove("show");
		});
	});

	const hiddenElements = document.querySelectorAll("div.hidden");

	hiddenElements.forEach((el) => observer.observe(el));