import * as React from "react"
import Layout from "../../components/layout"
import Seo from "../../components/seo"
import CilkBookHighlight from "../../components/cilkbook-highlight"
// import { codeToHtml } from "shiki"

/** Paste richly formatted text.
 *
 * @param {string} rich - the text formatted as HTML
 * @param {string} plain - a plain text fallback
 */
async function pasteRich(rich, plain) {
    if (typeof ClipboardItem !== "undefined") {
        // Shiny new Clipboard API, not fully supported in Firefox.
        // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API#browser_compatibility
        const html = new Blob([rich], { type: "text/html" });
        const text = new Blob([plain], { type: "text/plain" });
        console.log(rich)
        const data = new ClipboardItem({ "text/html": html, "text/plain": text });
        await navigator.clipboard.write([data]);
    } else {
        // Fallback using the deprecated `document.execCommand`.
        // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#browser_compatibility
        const cb = e => {
            e.clipboardData.setData("text/html", rich);
            e.clipboardData.setData("text/plain", plain);
            e.preventDefault();
        };
        document.addEventListener("copy", cb);
        document.execCommand("copy");
        document.removeEventListener("copy", cb);
    }
}

// Default code example to show when page is loaded.
const defaultInputCode =
`// -------------------- This comment is 80 characters long. --------------------
int64_t fib(int64_t n) {
  if (n < 2) return n;
  int64_t x, y;
  cilk_scope {
    x = cilk_spawn fib(n-1);
    y = fib(n-2);
  }
  return x + y;
}`

const CilkHighlightPage = () => {
    const [formData, setFormData] = React.useState({
        inputCode: defaultInputCode,
        inputCodeLang: "cilkcpp",
        inputCodeStyle: "cilkbook"
    })

    const handleInput = (e) => {
        const fieldName = e.target.name
        const fieldValue = e.target.value
        setFormData((prevState) => ({
            ...prevState,
            [fieldName]: fieldValue
        }))
    }

    // Action for copying formatted output to the clipboard.
    const copyFormattedToClipboard = () => {
        const str = document.getElementById('outputCode').innerHTML
        // Replace newlines with <br> in HTML
        pasteRich(str.replace(/(?:\r\n|\r|\n)/g, '<br>'), str)
    }

    React.useEffect(() => {
        const code = formData.inputCode
        const lang = formData.inputCodeLang
        const style = formData.inputCodeStyle
        const div = document.getElementById("outputCode")
        async function getHighlighted(code, lang, style) {
            div.innerHTML = await CilkBookHighlight(code, lang, style)
            // div.innerHTML = await codeToHtml(code, { lang: 'c++', theme: 'slack-ochin' })
        }
        getHighlighted(code, lang, style)
    })

    return (
        <Layout>
            <div className="w-full">
                <form className="grid grid-flow-row lg:grid-cols-2 lg:gap-x-4">
                    <div className="flex">
                        <label htmlFor="inputCode" className="block py-1 text-md text-gray-900">Enter code to highlight:</label>
                    </div>
                    <textarea className="flex lg:order-2 mb-2 lg:mb-0 w-full font-mono p-2.5 text-sm text-gray-900 bg-gray-50 rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500 whitespace-pre overflow-x-scroll" name="inputCode" id="inputCode" onChange={handleInput} value={formData.inputCode}></textarea>
                    <div className="flex space-x-4">
                        <div className="flex">
                            <button className="text-md bg-blue-500 hover:bg-blue-700 text-white px-3 border border-blue-700 rounded" onClick={copyFormattedToClipboard}>
                                Copy
                            </button>
                        </div>
                        <div className="flex space-x-1">
                            {/* <div className="flex has-tooltip"> */}
                            {/* <label htmlFor="inputCodeLang" className="text-md text-gray-900">Lang:</label> */}
                            {/* <span class='tooltip rounded-lg shadow-lg p-1 bg-gray-100 -mt-8'>Select language</span> */}
                            <select className="text-md text-gray-900 bg-gray-50 rounded px-1 border border-gray-300 focus:ring-blue-500 focus:border-blue-500" name="inputCodeLang" id="inputCodeLang" onChange={handleInput} value={formData.inputCodeLang}>
                                <option value="cilkcpp">Cilk/C++</option>
                                <option value="cilkc">Cilk/C</option>
                                <option value="cpp">C++</option>
                                <option value="c">C</option>
                            </select>
                            {/* </div> */}
                            {/* <div className="flex has-tooltip"> */}
                            {/* <label htmlFor="inputCodeStyle" className="text-md text-gray-900">Style:</label> */}
                            {/* <span class='tooltip rounded-lg shadow-lg p-1 bg-gray-100 -mt-8'>Select style</span> */}
                            <select className="text-md text-gray-900 bg-gray-50 rounded px-1 border border-gray-300 focus:ring-blue-500 focus:border-blue-500" name="inputCodeStyle" id="inputCodeStyle" onChange={handleInput} value={formData.inputCodeStyle}>
                                <option value="cilkbook">Cilkbook</option>
                                <option value="slack-dark">Slack (dark)</option>
                                <option value="slack-ochin">Slack (light)</option>
                            </select>
                            {/* </div> */}
                        </div>
                    </div>
                    <div id="outputCode" className="flex lg:order-2 border border-gray-300 rounded max-w-full overflow-x-scroll"></div>
                </form>
            </div>
        </Layout>
    )
}

export const Head = () => <Seo title="Code Highlighter" />

export default CilkHighlightPage
