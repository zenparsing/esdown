async f() {

    await 0;
}

({ async f() { await 0; } });

x => await y;